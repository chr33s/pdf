import React, { Component } from "react";
import { Button, Platform, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import test1 from "./tests/1.test";
import test10 from "./tests/10.test";
import test11 from "./tests/11.test";
import test12 from "./tests/12.test";
import test13 from "./tests/13.test";
import test14 from "./tests/14.test";
import test15 from "./tests/15.test";
import test16 from "./tests/16.test";
import test17 from "./tests/17.test";
import test2 from "./tests/2.test";
import test3 from "./tests/3.test";
import test4 from "./tests/4.test";
import test5 from "./tests/5.test";
import test6 from "./tests/6.test";
import test7 from "./tests/7.test";
import test8 from "./tests/8.test";
import test9 from "./tests/9.test";

const red = "#FF0000";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
    // marginBottom: -50,
    // marginBottom: 50,
  },
  subText: {
    fontSize: 18,
    // fontWeight: 'bold',
    // marginBottom: -50,
    marginTop: 5,
    marginBottom: 20,
  },
  button: {
    marginVertical: Platform.OS === "android" ? 5 : 0,
  },
});

export default class TestLauncher extends Component {
  render() {
    const { lastRunTest, onLaunchTest } = this.props;

    const TestButton = ({ test, longRunning = false }) => (
      <View style={styles.button}>
        <Button
          title={`Test ${test[0]}`}
          color={longRunning ? red : undefined}
          onPress={() => onLaunchTest(test[0], test[1])}
        />
      </View>
    );

    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>Tap a button to launch a test</Text>
        <Text style={styles.subText}>{lastRunTest && `(Just ran Test ${lastRunTest})`}</Text>
        <ScrollView>
          <TestButton test={[1, test1]} longRunning />
          <TestButton test={[2, test2]} longRunning />
          <TestButton test={[3, test3]} />
          <TestButton test={[4, test4]} />
          <TestButton test={[5, test5]} longRunning />
          <TestButton test={[6, test6]} longRunning />
          <TestButton test={[7, test7]} longRunning />
          <TestButton test={[8, test8]} />
          <TestButton test={[9, test9]} longRunning />
          <TestButton test={[10, test10]} />
          <TestButton test={[11, test11]} longRunning />
          <TestButton test={[12, test12]} />
          <TestButton test={[13, test13]} longRunning />
          <TestButton test={[14, test14]} />
          <TestButton test={[15, test15]} longRunning />
          <TestButton test={[16, test16]} />
          <TestButton test={[17, test17]} />
        </ScrollView>
      </SafeAreaView>
    );
  }
}
