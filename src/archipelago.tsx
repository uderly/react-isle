import React, { Component, Children } from 'react';

import Isle from "./isle";
import { ArchipelagoProps } from "./interfaces";

export class Archipelago extends Component<ArchipelagoProps> {
    isles: Isle[] = [];
    minimizedIsles: Isle[] = [];

    stackWidth:number = 0;
    
    mapIsle = (k:number, isle:Isle) => {
        this.isles[k] = isle;
    }

    minimizeIsle = (isle:Isle, scale:number = 1) => {
        this.minimizedIsles.push(isle);

        this.stackWidth += isle.getBoundingRect(scale).width;
    }

    restoreIsle = (k:number, isle:Isle) => {
        const index = this.minimizedIsles.findIndex(isle => isle.props.k === k);
        const r = isle.getBoundingRect();

        for(let i=(index+1); index > -1 && i<this.minimizedIsles.length; i++) {
            const pos = [ ...this.minimizedIsles[i].state.position ];
            pos[0] -= r.width;

            this.minimizedIsles[i].setPosition(pos);
        }
        
        // Remove from minimized isles
        this.minimizedIsles = this.minimizedIsles.filter(isle => isle.props.k !== k);

        this.stackWidth -= isle.getBoundingRect().width;
    }
    
    getStackBoundingRect = () => {
        return {
            top: 0,
            left: 0,
            width: this.stackWidth,
            right: 0
        };
    }

    getHighestZIndex() {
        let zIndex = 0;

        for(let i of this.isles)
            if(i && i.state.zIndex && i.state.zIndex > zIndex)
                zIndex = i.state.zIndex;

        return zIndex;
    }

    render() {
        const { className } = this.props;

        return <div className={"archipelago " + (className ? className : "")}>
            { Children.map(this.props.children, 
                (isle:any, i:number) => { return React.cloneElement(isle, { archipelago: this, k: (i+1), zIndex: (i+1) }); }) }
        </div>
    }
}