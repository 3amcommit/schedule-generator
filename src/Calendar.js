import BigCalendar from 'react-big-calendar';
import moment from 'moment';
import React from "react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { week } from "./constants";
import ScheduleTree from './helpers/Tree';

BigCalendar.momentLocalizer(moment);
let event = [];
export default class ScheduleCalendar extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            scheduleCombinations: [],
            num: 0
        }
        setInterval(_ => {
            this.setState({ num: this.state.num + 1 % 2 })

        }, 10000);

    }

    evaluate() {
        const courses = this.props.courses;
        const coursesLength = courses.length
        const schedule = {};
        // courses.forEach(course => {
        //     if (!course.fail)
        //         console.log((new CourseTree(course)).generate());
        // });

        console.log(event);
    }

    render() {
        const schedules = (new ScheduleTree(this.props.courses)).forCalendar();
        let schedule = schedules.length > 0 ? schedules[0] : []
        return (
            <div>
                <BigCalendar
                    events={schedule}
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

