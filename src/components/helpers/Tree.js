import { week } from "../constants";

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
                times.forEach(time => { // eslint-disable-line no-loop-func
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

export default class ScheduleTree {
    constructor(courses) {
        this.courseSegment = {};
        this._root = new Node("ROOT");
        const _this = this;
        this.schedules = [];
        courses.forEach(course => {
            if (course.fail === true) {
                console.log("Unable to retrieve course");
                return;
            }

            _this.courseSegment[course.course_code] = []
            new CourseTree(course).generate().combinations.forEach(combination => {
                _this.courseSegment[course.course_code].push(new Node(combination));
            });
        });
        this.generate();
    }

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

        let myLeaves = leaves;
        console.log(leaves);
        for (let i = 0; i < leaves.length; i++) {
            let leaf = leaves[i];
            let currNode = leaf;
            let times = {};
            while (currNode !== this._root) {
                currNode.elem.combination.forEach(comb => { // eslint-disable-line no-loop-func
                    if (times[`${comb.day}${comb.start}`] === undefined) {
                        times[`${comb.day}${comb.start}`] = comb; // eslint-disable-line no-loop-func
                    } else {
                        debugger;
                        myLeaves[myLeaves.indexOf(leaf)] = null;
                    }
                });
                currNode = currNode.parent;
            }
            console.log(times);

        }
        myLeaves = myLeaves.filter(n => n);
        console.log(myLeaves);
        this.schedules = myLeaves;
    }

    forCalendar() {
        const scheduleList = [];
        this.schedules.length > 0 && this.schedules.forEach(leaf => {
            let activeNode = leaf;
            const schedule = [];
            while (activeNode !== this._root) {
                let course_code;
                Object.keys(this.courseSegment).forEach(course => { // eslint-disable-line no-loop-func
                    if (this.courseSegment[course].indexOf(activeNode) > -1) {
                        course_code = course; // eslint-disable-line no-loop-func
                    }
                })
                activeNode.elem.combination.forEach(activity => {
                    let [startHour, startMin] = activity.start.split(":");
                    let [endHour, endMin] = activity.end.split(":");
                    schedule.push({
                        start: week.day(activity.day).hour(parseInt(startHour, 10)).minute(parseInt(startMin, 10)).toDate(),
                        end: week.day(activity.day).hour(parseInt(endHour, 10)).minute(parseInt(endMin, 10)).toDate(),
                        title: `${activity.activity} | ${course_code} | ${activity.location}`
                    })
                })
                activeNode = activeNode.parent;
            }
            scheduleList.push(schedule);
        });
        return scheduleList;
    }
}

class Node {
    constructor(elem) {
        this.elem = elem;
        this.parent = null;
        this.children = [];
    }
}

