/**
 * @fileoverview Frontend bridge for Antigravity sidecars.
 *
 * This script is meant to be injected into the sidecar's Web UI (iframe/webview).
 * It establishes the `window.sidecar` global object, allowing the frontend
 * to securely communicate with the Node.js backend (index.mjs) and
 * interact with the Antigravity Agent API.
 */

(function() {
  // Extract configuration from query parameters.
  const config = (function() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const conversationId = params.get('conversationId');
    return { token, conversationId };
  })();

  const { token, conversationId } = config;

  // The active workspace folders are pushed by the host via `workspace-change`
  // messages (on iframe load and whenever the selection changes) rather than
  // baked into the URL, so they can change without reloading the iframe.
  let currentWorkspaceUris = [];
  let hasInitialWorkspace = false;
  const workspaceListeners = new Set();
  let resolveInitialWorkspace;
  const initialWorkspacePromise = new Promise((resolve) => {
    resolveInitialWorkspace = resolve;
  });

  function areUriArraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  function notifyWorkspaceListener(listener) {
    try {
      listener([...currentWorkspaceUris]);
    } catch (err) {
      console.error('workspace-change listener failed:', err);
    }
  }

  // Listen for events sent by the parent window.
  // - `theme-change`: the host theme changed; apply the new CSS variables
  //   (colors, fonts) to the iframe's root element to keep the UI in sync.
  // - `workspace-change`: the active workspace changed; record it and notify
  //   subscribers.
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'theme-change') {
      const vars = event.data.payload.cssVariables;
      for (const [key, value] of Object.entries(vars)) {
        document.documentElement.style.setProperty(key, value);
      }
    } else if (event.data?.type === 'workspace-change') {
      const payload = event.data.payload ?? {};
      const nextWorkspaceUris = Array.isArray(payload.workspaceUris)
        ? [...payload.workspaceUris]
        : [];
      const isFirstPush = !hasInitialWorkspace;
      const hasChanged =
        isFirstPush ||
        !areUriArraysEqual(currentWorkspaceUris, nextWorkspaceUris);
      currentWorkspaceUris = nextWorkspaceUris;
      hasInitialWorkspace = true;
      resolveInitialWorkspace();
      if (hasChanged) {
        for (const listener of workspaceListeners) {
          notifyWorkspaceListener(listener);
        }
      }
    }
  });

  // Apply theme-aware styles to the body element.
  // This ensures the iframe body matches the host's background, foreground,
  // and font family, preventing jarring white flashes on load. The tokens come
  // from the `theme-change` payload above; the literal fallbacks only apply
  // when the page is opened outside the host (e.g. directly in a browser).
  const applyBodyStyles = () => {
    if (document.body) {
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.background = 'var(--background, #fafafa)';
      document.body.style.color = 'var(--foreground, #333)';
      document.body.style.fontFamily =
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyBodyStyles);
  } else {
    applyBodyStyles();
  }

  // Forward modifier shortcut chords to the host window so global product
  // shortcuts (e.g. Cmd/Ctrl+B to toggle the sidebar) continue to work when
  // focus is inside a cross-origin sidecar iframe, without exposing plain
  // typing or hijacking native text-editing chords inside form controls and
  // rich-text editors.
  const PURE_MODIFIER_KEYS = new Set([
    'Control',
    'Meta',
    'Alt',
    'Shift',
    'AltGraph',
  ]);
  const EDITABLE_NAVIGATION_KEYS = new Set([
    'arrowleft',
    'arrowright',
    'arrowup',
    'arrowdown',
    'home',
    'end',
  ]);
  const NON_TEXT_INPUT_TYPES = new Set([
    'button',
    'checkbox',
    'color',
    'file',
    'hidden',
    'image',
    'radio',
    'range',
    'reset',
    'submit',
  ]);

  function isContentEditableTarget(target) {
    if (!target || typeof target !== 'object') {
      return false;
    }
    if (target.isContentEditable) {
      return true;
    }
    if (typeof target.closest !== 'function') {
      return false;
    }
    const ce = target.closest('[contenteditable]');
    return Boolean(ce && ce.getAttribute('contenteditable') !== 'false');
  }

  function isEditableTarget(target) {
    if (!target || typeof target !== 'object') {
      return false;
    }
    const tagName =
      typeof target.tagName === 'string' ? target.tagName.toUpperCase() : '';
    if (tagName === 'TEXTAREA' || tagName === 'SELECT') {
      return !target.disabled && !target.readOnly;
    }
    if (tagName === 'INPUT') {
      const inputType =
        typeof target.type === 'string' ? target.type.toLowerCase() : 'text';
      return (
        !NON_TEXT_INPUT_TYPES.has(inputType) &&
        !target.disabled &&
        !target.readOnly
      );
    }
    if (isContentEditableTarget(target)) {
      return true;
    }
    if (typeof target.closest === 'function') {
      const textbox = target.closest('[role="textbox"]');
      if (textbox && textbox.getAttribute('aria-disabled') !== 'true') {
        return true;
      }
    }
    return false;
  }

  function isNativeClipboardChord(e, keyLower) {
    return (
      (e.ctrlKey || e.metaKey) &&
      !e.altKey &&
      ((!e.shiftKey && (keyLower === 'c' || keyLower === 'x')) ||
        keyLower === 'v')
    );
  }

  function isEditableTextChord(e, keyLower) {
    // Option/Alt + printable character (e.g. macOS Option+c -> 'ç') produces
    // text input and must not trigger global Alt shortcuts.
    if (!e.ctrlKey && !e.metaKey) {
      if (!e.altKey || (typeof e.key === 'string' && e.key.length <= 1)) {
        return true;
      }
    }
    if (EDITABLE_NAVIGATION_KEYS.has(keyLower)) {
      return true;
    }
    if (!e.shiftKey && (keyLower === 'backspace' || keyLower === 'delete')) {
      return true;
    }
    if ((e.ctrlKey || e.metaKey) && !e.altKey) {
      if (
        (!e.shiftKey && (keyLower === 'a' || keyLower === 'y')) ||
        keyLower === 'z'
      ) {
        return true;
      }
    }
    return false;
  }

  // Cmd/Ctrl+B, Cmd/Ctrl+I and Cmd/Ctrl+U toggle bold, italic and underline in
  // rich-text (contenteditable) editors. Plain <input>/<textarea> controls have
  // no native formatting, so these chords are still forwarded from them.
  function isRichTextFormattingChord(e, keyLower) {
    return (
      (e.ctrlKey || e.metaKey) &&
      !e.altKey &&
      !e.shiftKey &&
      (keyLower === 'b' || keyLower === 'i' || keyLower === 'u')
    );
  }

  function shouldForwardKeyDown(e) {
    if (e.defaultPrevented || e.isComposing || e.keyCode === 229) {
      return false;
    }
    if (typeof e.key !== 'string' || PURE_MODIFIER_KEYS.has(e.key)) {
      return false;
    }
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      return false;
    }
    if (
      typeof e.getModifierState === 'function' &&
      e.getModifierState('AltGraph')
    ) {
      return false;
    }
    const keyLower = e.key.toLowerCase();
    if (isNativeClipboardChord(e, keyLower)) {
      return false;
    }
    const rawTarget =
      (typeof e.composedPath === 'function' && e.composedPath()[0]) || e.target;
    if (isEditableTarget(rawTarget) && isEditableTextChord(e, keyLower)) {
      return false;
    }
    if (
      isContentEditableTarget(rawTarget) &&
      isRichTextFormattingChord(e, keyLower)
    ) {
      return false;
    }
    return true;
  }

  if (window.parent && window.parent !== window) {
    const forwardedKeyIds = new Set();

    const getKeyTrackingId = (e) =>
      e.code || (typeof e.key === 'string' ? e.key.toLowerCase() : '');

    const postKeyEvent = (e) => {
      window.parent.postMessage(
        {
          type: 'sidecar-key-event',
          payload: {
            eventType: e.type,
            key: e.key,
            code: e.code || '',
            ctrlKey: Boolean(e.ctrlKey),
            metaKey: Boolean(e.metaKey),
            altKey: Boolean(e.altKey),
            shiftKey: Boolean(e.shiftKey),
            repeat: Boolean(e.repeat),
          },
        },
        '*',
      );
    };

    window.addEventListener('keydown', (e) => {
      if (!shouldForwardKeyDown(e)) {
        return;
      }
      const trackingId = getKeyTrackingId(e);
      if (trackingId) {
        forwardedKeyIds.add(trackingId);
      }
      postKeyEvent(e);
    });

    window.addEventListener('keyup', (e) => {
      if (e.isComposing || e.keyCode === 229 || typeof e.key !== 'string') {
        return;
      }
      const trackingId = getKeyTrackingId(e);
      const wasForwarded = trackingId && forwardedKeyIds.delete(trackingId);
      if (wasForwarded || (forwardedKeyIds.size > 0 && e.key === 'Meta')) {
        if (e.key === 'Meta') {
          forwardedKeyIds.clear();
        }
        postKeyEvent(e);
      }
    });

    window.addEventListener('blur', () => {
      forwardedKeyIds.clear();
    });
  }

  // secureFetch helper automatically injects the security token
  // for requests to the sidecar backend.
  function secureFetch(url, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    if (token) {
      headers.set('X-Sidecar-Token', token);
    }
    return fetch(url, { ...options, headers });
  }

  const projectIdPromise = (async () => {
    if (conversationId) {
      try {
        const res = await secureFetch('/_sidecar/get-conversation-metadata', {
          method: 'POST',
          body: JSON.stringify({ conversationId })
        });
        if (!res.ok) {
          console.error('Failed to resolve project ID for conversation ' + conversationId + ':', await res.text());
          return '';
        }
        const data = await res.json();
        if (data && data.error) {
          console.error('agentapi returned error resolving project ID:', data.error);
          return '';
        }
        const metaEvent = data?.response?.conversationMetadata || data?.response?.conversation_metadata;
        const meta = metaEvent?.metadata;
        const resolvedId = meta?.projectId || meta?.project_id || '';
        return resolvedId;
      } catch (err) {
        console.error('Failed to resolve project ID for conversation ' + conversationId + ':', err);
        return '';
      }
    }
    return '';
  })();

  async function getWorkspaceUris() {
    if (window.parent === window) {
      return [];
    }
    await initialWorkspacePromise;
    return [...currentWorkspaceUris];
  }

  // Expose the sidecar API to the frontend window.
  window.sidecar = {
    conversationId,
    fetch: secureFetch, // Secure fetch wrapper that includes the sidecar token.
    // Resolves to all workspace folder URIs of the conversation (a project can
    // have several); empty if no workspace is open. Waits for the host's first
    // push, so it is safe to call as early as script load. Outside a host (e.g.
    // the page is opened directly in a browser) it resolves to [] immediately.
    getWorkspaceUris,
    // Subscribe to workspace changes. The listener receives the list of
    // workspace folder URIs (`string[]`). If the initial workspace has already
    // been pushed, the listener is invoked asynchronously via microtask with
    // the current state. Returns an unsubscribe function.
    onWorkspaceChange(listener) {
      if (typeof listener !== 'function') {
        return () => {};
      }
      workspaceListeners.add(listener);
      if (hasInitialWorkspace) {
        queueMicrotask(() => {
          if (workspaceListeners.has(listener)) {
            notifyWorkspaceListener(listener);
          }
        });
      }
      return () => {
        workspaceListeners.delete(listener);
      };
    },
    // Agent API interactions.
    agent: {
      // Send a message to a conversation.
      async sendMessage(message, convId) {
        const resolvedProjectId = await projectIdPromise;
        const res = await secureFetch('/_sidecar/send-message', {
          method: 'POST',
          body: JSON.stringify({
            conversationId: convId || conversationId,
            message,
            projectId: resolvedProjectId
          })
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      },
      // Start a new conversation.
      async startConversation(message, title) {
        const resolvedProjectId = await projectIdPromise;
        const res = await secureFetch('/_sidecar/new-conversation', {
          method: 'POST',
          body: JSON.stringify({ message, title, projectId: resolvedProjectId })
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      },
      // Retrieve metadata for a conversation.
      async getConversationMetadata(conversationId) {
        const res = await secureFetch('/_sidecar/get-conversation-metadata', {
          method: 'POST',
          body: JSON.stringify({ conversationId })
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      }
    },
    // UI control methods.
    ui: {
      toggleAuxPane(request) {
        window.parent.postMessage({
          type: 'toggle-aux-pane',
          payload: request
        }, '*');
      },
      toggleConversation(conversationId, options) {
        const payload =
          options && typeof options === 'object'
            ? { conversationId, ...options }
            : { conversationId };
        window.parent.postMessage({
          type: 'toggle-conversation',
          payload
        }, '*');
      },
      // Adds a pending comment on a document this sidecar renders, sent with
      // the user's next message. See sidecar.d.ts for the fields.
      addArtifactComment({ uri, comment, selection, pageTitle } = {}) {
        window.parent.postMessage({
          type: 'add-artifact-comment',
          payload: { uri, comment, selection, pageTitle }
        }, '*');
      }
    }
  };
})();

