/**
 * The attributes a host page uses to configure and trigger the guide.
 *
 * They live in core rather than in the SDK because the distiller has to
 * recognise the trigger too: a control whose only purpose is to open Hintora is
 * never a step inside a Hintora flow, so it is filtered out of the page map
 * before the model ever sees it.
 *
 * One prefix, one spelling, whether the attribute sits on the embed script tag
 * or on the document root.
 */
export const TRIGGER_ATTRIBUTE = 'data-hintora-trigger';

export const ENDPOINT_ATTRIBUTE = 'data-hintora-endpoint';

export const HOTKEY_ATTRIBUTE = 'data-hintora-hotkey';
