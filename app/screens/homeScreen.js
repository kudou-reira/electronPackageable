import React, { Component } from 'react';
import PocketPanel from '../components/pocketPanel';
import WeatherPanel from '../components/weatherPanel';

class HomeScreen extends Component {
  render() {
    return (
      <div>
        <h1>This is the homescreen</h1>
        <PocketPanel />
        <WeatherPanel />
      </div>
    );
  }
}

export default HomeScreen;
