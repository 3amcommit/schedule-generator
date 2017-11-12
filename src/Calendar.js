import BigCalendar from 'react-big-calendar';
import moment from 'moment';
import React from "react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { week } from "./constants";

BigCalendar.momentLocalizer(moment);
let event = [];
export default class ScheduleCalendar extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            scheduleCombinations: []
        }
        
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
        return (
            <div>
                <BigCalendar
                    events={(new ScheduleTree(this.props.courses)).forCalendar()[0]}
                    min={week.day("Monday").hour(8).minute(0).toDate()}
                    max={week.day("Monday").hour(22).minute(30).toDate()}
                    date={week.toDate()}
                    defaultView='work_week'
                    views={{work_week:true}}
                    timeslots={3}
                    selectable = 'ignoreEvents'
                    toolbar = {false}
                     />
            </div>
        )
    }
}

class Node {
    constructor(elem) {
        this.elem = elem;
        this.parent = null;
        this.children = [];
    }
}

class SectionTree {

    constructor(section) {
        this.activities = section.activities;
        this._root = new Node(section);
        this.treeData = {};
        this.meta = {};
        this.fill();
    }

    fill() {
        const _this = this
        this.activities.forEach(function (element) {
            // _this._time(element);
            if (_this.treeData[element.activity] === undefined) {
                _this.treeData[element.activity] = [];
            }
            _this.treeData[element.activity].push(element)
        });
        this.makeTree();
    }

    //LEC -> DGD -> TUT -> LAB
    makeTree() {
        let activeNode = [this._root];
        if (this.treeData["LEC"]) {
            activeNode = activeNode[0];
            this.meta["LECnodes"] = [];
            this.treeData["LEC"] && this.treeData["LEC"].forEach(lec => {
                const node = new Node(lec, "LEC");
                node.parent = activeNode;
                activeNode.children.push(node);
                activeNode = node;
                this.meta["LECnodes"].push(lec);
                this.meta["lastLECNode"] = [activeNode];
            });
        }

        //should be simplified.
        activeNode = this.meta.lastLECNode || activeNode;
        if (this.treeData["DGD"]) {
            this.meta["DGDnodes"] = [];
            activeNode.forEach(actvnode => {
                this.treeData["DGD"].forEach(dgd => {
                    const node = new Node(dgd);
                    node.parent = actvnode;
                    actvnode.children.push(node);
                    this.meta["DGDnodes"].push(node);
                });
            });
        }

        activeNode = this.meta["DGDnodes"] || this.meta.lastLECNode || activeNode;
        if (this.treeData["TUT"]) {
            this.meta["TUTnodes"] = [];
            activeNode.forEach(actvnode => {
                this.treeData["TUT"].forEach(dgd => {
                    const node = new Node(dgd);
                    node.parent = actvnode;
                    actvnode.children.push(node);
                    this.meta["TUTnodes"].push(node);
                });
            });
        }

        activeNode = this.meta["TUTnodes"] || this.meta["DGDnodes"] || this.meta.lastLECNode || activeNode;
        if (this.treeData["LAB"]) {
            this.meta["LABnodes"] = [];
            activeNode.forEach(actvnode => {
                this.treeData["LAB"].forEach(lab => {
                    const node = new Node(lab);
                    node.parent = actvnode;
                    actvnode.children.push(node);
                    this.meta["LABnodes"].push(node);
                });
            });

        }

        this.verifyAndDelete();
    }


    verifyAndDelete() {
        const leaves = this.meta["LABnodes"] || this.meta["TUTnodes"] || this.meta["DGDnodes"] || this.meta.lastLECNode || [this._root];
        leaves.forEach((leaf, index, object) => {
            let activeNode = leaf;
            const times = [];
            while (activeNode !== this._root) {
                let [startHour, startMin] = activeNode.elem.start.split(":");
                let [endHour, endMin] = activeNode.elem.end.split(":");
                times.forEach(time => {
                    if (time.day !== activeNode.elem.day) {
                        return;
                    }
                    if (parseFloat(time.startHour) + parseFloat(time.startMin) / 100 >= parseFloat(endHour) + parseFloat(endMin) / 100
                        || parseFloat(time.endHour) + parseFloat(time.endMin) / 100 >= parseFloat(startHour) + parseFloat(startMin) / 100) {
                        times.push({ day: activeNode.elem.day, startHour, startMin, endHour, endMin });
                        return;
                    } else {
                        console.log("deleting", leaf);
                        leaf.parent.children.splice(leaf.parent.children.indexOf(leaf), 1);
                        leaf.parent = null;
                        object.splice(index, 1);
                        console.log("deleted", leaf);
                    }

                });
                if (times.length === 0) {
                    times.push({ day: activeNode.elem.day, startHour, startMin, endHour, endMin })
                }

                activeNode = activeNode.parent;
            }
        });
    }

    generate() {
        const combinations = []
        const leaves = this.meta["LABnodes"] || this.meta["TUTnodes"] || this.meta["DGDnodes"] || this.meta.lastLECNode || [this._root];
        leaves.forEach(leaf => {
            let activeNode = leaf;
            const combination = [];
            while (activeNode !== this._root) {
                combination.push(activeNode.elem);
                activeNode = activeNode.parent;
            }
            combination.reverse();
            combinations.push({ combination, professor: this._root.elem.professor, section: this._root.elem.section });
        })
        return combinations;
    }

}

class CourseTree {
    constructor(course) {
        this.course = new Node(course);
        this.meta = {
            code: course.course_code,
            name: course.course_title,
        }
        this.sections = []
        course.sections.forEach(section => {
            let tSection = new SectionTree(section);
            tSection._root.parent = this.course;
            this.course.children.push(tSection._root);
            this.sections.push(tSection);
        });
    }

    generate() {
        let combinations = [];
        this.sections.forEach(section => {
            combinations = combinations.concat(section.generate());
        });
        return { info: this.meta, combinations };
    }

}

class ScheduleTree {
    constructor(courses) {
        this.courseSegment = {};
        this._root = new Node("ROOT");
        const _this = this;
        this.schedules = [];
        courses.forEach(course => {
            if (course.fail == true) {
                console.log("Unable to retrieve course");
                return;
            }

            _this.courseSegment[course.course_code] = []
            new CourseTree(course).generate().combinations.forEach(combination => {
                _this.courseSegment[course.course_code].push(new Node(combination));
            });
        });
        this.generate();
        console.log(this);
    }

    generateUGLY() { //I APOLOGIZE FOR HAVING YOU READ THIS 😢
        for (let i = 0; i < this.courseSegment.length - 1; i++) {
            for (let j = i; j < this.courseSegment.length; j++) {
                for (let k = 0; k < this.courseSegment[i].combinations.length; k++) {
                    for (let l = 0; l < this.courseSegment[j].combinations.length; l++) {
                        for (let m = 0; m < this.courseSegment[i].combinations[k].combination.length; m++) {
                            for (let n = 0; n < this.courseSegment[i].combinations[l].combination.length; n++) {
                                // let [startHour, startMin] = this.courseSegment[i].combinations[l].combination[m].time.split(":");
                                // let [endHour, endMin] = activeNode.elem.end.split(":");
                                // times.forEach(time => {
                                //     if (time.day !== activeNode.elem.day) {
                                //         return;
                                //     }
                                //     if (parseFloat(time.startHour) + parseFloat(time.startMin) / 100 >= parseFloat(endHour) + parseFloat(endMin) / 100
                                //         || parseFloat(time.endHour) + parseFloat(time.endMin) / 100 >= parseFloat(startHour) + parseFloat(startMin) / 100) {
                                //         times.push({ day: activeNode.elem.day, startHour, startMin, endHour, endMin });
                                //         return;
                                //     } else {
                                //         console.log("deleting", leaf);
                                //         object.splice(index, 1);
                                //         console.log("deleted", leaf);
                                //     }

                                // });
                            }
                        }
                    }
                }
            }
        }
    }

    // generate() {
    //     for(let i = 0; i< this.courseSegment)
    //     for(let keys in this.courseSegment){
    //         console.log(keys);
    //     }
    // }

    generate() {
        let keys = Object.keys(this.courseSegment);
        let activeNode = [this._root];
        keys.forEach(key => {
            let next = []
            activeNode.forEach(actvNode => {
                this.courseSegment[key].forEach(comb => {
                    actvNode.children.push(comb);
                    comb.parent = actvNode;
                    next.push(comb);
                });
            })
            activeNode = next;
        });

        const leaves = activeNode;
        const leavesLength = leaves.length;
        const scheduleList = []
        // go back up and verify
        leaves.forEach((leaf, index, object) => {
            let currNode = leaf;
            let times = [];
            while (currNode !== this._root) {
                let deleteLeaf = false;
                times.forEach(time => {
                    currNode.elem.combination.forEach(activity => {
                        let [startHour, startMin] = activity.start.split(":");
                        let [endHour, endMin] = activity.end.split(":");
                        if (time.day !== activity.day) {
                            times.push({ day: activeNode.day, startHour, startMin, endHour, endMin });
                            return;
                        }
                        if (parseFloat(time.startHour) + parseFloat(time.startMin) / 100 >= parseFloat(endHour) + parseFloat(endMin) / 100
                            || parseFloat(time.endHour) + parseFloat(time.endMin) / 100 >= parseFloat(startHour) + parseFloat(startMin) / 100) {
                            times.push({ day: activity.day, startHour, startMin, endHour, endMin });
                            return;
                        } else {
                            deleteLeaf = true;
                            return;
                        }
                    });
                });
                if (deleteLeaf === true) {
                    // leaf.parent.children.splice(leaf.parent.children.indexOf(leaf), 1);
                    // leaf.parent = null;
                    object.splice(index, 1);
                }

                if (times.length === 0) {
                    currNode.elem.combination.forEach(activity => {
                        let [startHour, startMin] = activity.start.split(":");
                        let [endHour, endMin] = activity.end.split(":");
                        times.push({ day: activity.day, startHour, startMin, endHour, endMin });
                    });
                }
                currNode = currNode.parent;
            }
        });
        this.schedules = leaves;
    }

    forCalendar() {
        const scheduleList = [];
        this.schedules.forEach(leaf => {
            let activeNode = leaf;
            const schedule = [];
            while (activeNode.parent !== null) {
                let course_code;
                Object.keys(this.courseSegment).forEach(course => {
                    if(this.courseSegment[course].indexOf(activeNode) > -1 ){
                        course_code = course;
                    } 
                })                
                activeNode.elem.combination.forEach(activity => {
                    let [startHour, startMin] = activity.start.split(":");
                    let [endHour, endMin] = activity.end.split(":");
                    schedule.push({
                        start: week.day(activity.day).hour(parseInt(startHour,10)).minute(parseInt(startMin,10)).toDate(),
                        end: week.day(activity.day).hour(parseInt(endHour,10)).minute(parseInt(endMin)).toDate(),
                        title: `${activity.activity} | ${course_code}`
                    })
                })
                activeNode = activeNode.parent;
            }
            scheduleList.push(schedule);
        });
        console.log(scheduleList[0]);
        return scheduleList;
    }
}