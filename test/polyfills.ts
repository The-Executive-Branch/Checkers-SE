// jsdom (the fake browser the tests run in) is missing a few browser
// features the app uses. This file runs before React loads, because React
// checks for AnimationEvent once at startup to decide which event to listen to.

if (typeof window.AnimationEvent === "undefined") {
  class AnimationEventPolyfill extends Event {
    animationName: string;
    elapsedTime: number;
    pseudoElement: string;

    constructor(type: string, init: AnimationEventInit = {}) {
      super(type, init);
      this.animationName = init.animationName ?? "";
      this.elapsedTime = init.elapsedTime ?? 0;
      this.pseudoElement = init.pseudoElement ?? "";
    }
  }
  window.AnimationEvent = AnimationEventPolyfill as typeof AnimationEvent;
}

// <dialog>'s showModal() and close() aren't implemented in jsdom.
if (typeof HTMLDialogElement.prototype.showModal !== "function") {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}
