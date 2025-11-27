import { act } from "react";
import "react-native";

// Mock native modules that aren't available in Jest
jest.mock("react-native-blob-util", () => ({
  __esModule: true,
  default: {},
}));

jest.mock("react-native-pdf", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: () => React.createElement("div"),
  };
});

// Mock the test-launcher to avoid loading the PDF library tests
jest.mock("../src/test-launcher", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: () => React.createElement("div"),
  };
});

import App from "../src/app";

// Note: test renderer must be required after react-native.
import renderer from "react-test-renderer";

it("renders correctly", async () => {
  await act(async () => {
    renderer.create(<App />);
  });
});
