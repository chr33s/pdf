/**
 * @format
 */

import "react-native";
import App from "../src/components/App.js";

// Note: test renderer must be required after react-native.
import renderer from "react-test-renderer";

it("renders correctly", () => {
  renderer.create(<App />);
});
