import React, { Component } from "react";
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import course from '../schedules/schedules_winter_2018_final.json';
import {store} from '../store';


const options = [];
export default class Control extends Component {

  constructor(){
    super();
    this.state = {
      value: []
    }

  }

  componentDidMount(){

    course.courses.forEach(course => {
      options.push(
        {
          label: `${course.course_code} | ${course.course_title}`,
          value: course.course_code
        }
      )
    });
    
  }

  handleSelectChange (value) {
    store.dispatch({
      type: "Update",
      courses: value.split(",")});
		this.setState({ value });
  }


  render() {
    const value = this.state.value;
    return (
      <Select
      multi
      onChange={(val) => this.handleSelectChange(val)}
      options={options}
      placeholder="Select your favourite(s)"
      simpleValue
      value={value}
      />
    )
  }
}