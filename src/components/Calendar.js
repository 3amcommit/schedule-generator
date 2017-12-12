import BigCalendar from 'react-big-calendar';
import moment from 'moment';
import React from "react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { week } from "./constants";
import ScheduleTree from './helpers/Tree';
import "./Calendar.css"
import Courses from '../schedules/schedules_winter_2018_final.json';
import {store} from '../store';


BigCalendar.momentLocalizer(moment);
export default class ScheduleCalendar extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            scheduleCombinations: [],
            num: 0,
            courses: []
        }
        store.subscribe(() => this.update())
        this.update();
    }

    update() {
        const courses = store.getState();
        const selectedCourses = [];
        courses.forEach(course => {
            const c = Courses.courses.find((obj)=> obj.course_code === course);
            c && selectedCourses.push(c);
        });
        this.setState({courses: selectedCourses});
    }


    prerender(){
        const schedules = this.state.courses.length > 0 && (new ScheduleTree(this.state.courses)).forCalendar();
        const schedule = schedules.length > 0 ? schedules[0] : []
        debugger;
        return schedule;
    }

    render() {
       
        return (
            <div>
                <BigCalendar
                    events={this.prerender()}
                    min={week.day("Monday").hour(8).minute(0).toDate()}
                    max={week.day("Monday").hour(22).minute(30).toDate()}
                    defaultDate={week.toDate()}
                    defaultView='work_week'
                    views={{ work_week: true }}
                    timeslots={3}
                    selectable='ignoreEvents'
                    toolbar={false}
                />
            </div>
        )
    }
}

