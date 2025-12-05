import * as fontkitNs from "/packages/fontkit/dist/index.min.js";
import * as pdfLibNs from "/packages/pdf/dist/index.min.js";

const fontkit = fontkitNs.default ?? fontkitNs;
const PDFLib = pdfLibNs.default ?? pdfLibNs;

if (typeof window !== "undefined") {
  window.fontkit = fontkit;
  window.PDFLib = PDFLib;
  window.startFpsTracker = startFpsTracker;
  window.PDFLibScriptLoaded = true;
}

function startFpsTracker(id) {
  const element = document.getElementById(id);

  const moveTo = (xCoord) => (element.style.transform = `translateX(${xCoord}px)`);

  let xCoord = 0;
  const delta = 7;

  const slideRight = () => {
    moveTo(xCoord);
    xCoord += delta;

    if (xCoord > 100) {
      requestAnimationFrame(slideLeft);
    } else {
      requestAnimationFrame(slideRight);
    }
  };

  const slideLeft = () => {
    moveTo(xCoord);
    xCoord -= delta;

    if (xCoord < -100) {
      requestAnimationFrame(slideRight);
    } else {
      requestAnimationFrame(slideLeft);
    }
  };

  requestAnimationFrame(slideRight);
}
