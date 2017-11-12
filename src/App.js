import React, { Component } from 'react';
import Calendar from "./Calendar";
import './App.css';
import Courses from  './schedules/schedule_mini.json';

class App extends Component {
  render() {
    return (
      <div className="App">
      <Calendar courses={Courses.courses} />
      </div>
    );
  }
}

export default App;
