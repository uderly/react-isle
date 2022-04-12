import React, { AnimationEventHandler, Component } from 'react';
import ReactDOM from 'react-dom';
import Hammer from 'react-hammerjs';

import { IsleViewModesEnum } from "./index";
import { IsleProps, IsleState, IsleParams } from "./interfaces";
import { xmarkSvg, expandSvg } from "./icons.svg";

import './isle.css';

// Utility functions

function valString(s:string | undefined, emptyval:string = "") {
    if (!s || s.trim() === "" || (s.trim()).length === 0) {
        return emptyval;
    }
    return s;
}

function valBoolean(v:boolean | undefined, r:any = "") {
    if (v)
        return r;
    return "";
}

export default class Isle extends Component<IsleProps, IsleState> {
    DEFAULT_PARAMS:IsleParams = {
        minScale: 0.5,
        maxScale: 2,
        scale: 1,
        x: 0,
        y: 0,
        rotation: 0,
        minimizeDurationMs: 500,
        iconHeight: 64
    };

    stateShot:IsleState|null = null;
    params:IsleParams = {};

    private node:any = null;
    private archipelagoNode:Element|null = null;
    private transition:any = null;
    private iPosition:any = null;
    private iScale:any = null;
    private iRotation:any = null;
    private pinchStartRotation:any = null;

    constructor(props:any) {
        super(props);

        Object.assign(this.params, this.DEFAULT_PARAMS, props.params ? props.params : []);
            
        this.state = {
            viewMode: IsleViewModesEnum.Normal,
            position: [this.params.x as number, this.params.y as number],
            scale: this.params.scale as number,
            rotation: this.params.rotation as number,
            hidingFrame: false,
            zIndex: this.props.zIndex ? this.props.zIndex : 0
        };
    }

    getState = () => {
        return this.state;
    }

    takeStateShot = () => {
        return this.stateShot = { ...this.state };
    }

    restoreState = (shot:IsleState|null) => {
        this.setState(shot);
    }

    componentDidMount() {
        const { archipelago, k } = this.props;

        if(archipelago && k)
            archipelago.mapIsle(k, this);

        this.archipelagoNode = archipelago ? ReactDOM.findDOMNode(archipelago) as Element | null : null;

        this.node = ReactDOM.findDOMNode(this);
        this.node.addEventListener("wheel", this.onWheel);

        window.addEventListener("resize", this.onResize.bind(this));

        if(this.props.minimized)
            this.minimize();
    }

    onElementDragStart = (e:Event) => { console.log(e); e.preventDefault(); }

    setPosition = (pos:Array<number>) => {
        this.setState({
            position: pos
        });
    }
    
    componentWillUnmount() {
        this.node.removeEventListener("wheel", this.onWheel);
        window.removeEventListener("resize", this.onResize.bind(this));
        
        const content = document.querySelector('.isle-content *');
        
        if(content)
            content.removeEventListener('dragstart', this.onElementDragStart);
    }

    onResize() {
        if(this.state.viewMode !== IsleViewModesEnum.Minimized)
            this.setState({
                position: this.validatePosition(null, this.state.position)
            });
    }

    validatePosition = (e:any, pos:any) => {
        if(this.node) {
            const parentRect = (this.archipelagoNode) ? this.archipelagoNode.getBoundingClientRect() : { 
                top: 0,
                left: 0,
                width: window.innerWidth, 
                height: window.innerHeight
            };

            const r = this.getBoundingRect();

            // Let's refer to the actual dimensions
            r.width = r.width / this.state.scale;
            r.height = r.height / this.state.scale;
            
            // Let's refer to central position
            const vPos = [pos[0] + (r.width / 2), pos[1] + (r.height / 2)];
    
            if(vPos[0] > (parentRect.width)) // window.innerWidth
                vPos[0] = (parentRect.width) // window.innerWidth
    
            if(vPos[1] > (parentRect.height)) // window.innerHeight
                vPos[1] = (parentRect.height); // window.innerHeight
    
            if(vPos[0] < 0)
                vPos[0] = 0;
    
            if((vPos[1]) < 0)
                vPos[1] = 0;
    
            return [vPos[0] - r.width / 2, vPos[1] - r.height / 2];
        }

        return pos;
    }

    handlePanStart = (e:any) => {
        this.bringToFront();

        this.iPosition = this.state.position;
        this.transition = 'none';

        this.restore();
        
        e.srcEvent.preventDefault();
        e.srcEvent.stopPropagation();
    }

    handlePan = (e:any) => {
        const p = this.iPosition;

        this.setState({
            position: this.validatePosition(e, [p[0] + e.deltaX, p[1] + e.deltaY])
        })

        e.srcEvent.preventDefault();
        e.srcEvent.stopPropagation();
    }

    handlePanEnd = (e:any) => {
        e.srcEvent.preventDefault();
        e.srcEvent.stopPropagation();
    }

    handlePinchStart = (e:any) => {
        this.restore();

        this.iScale = this.state.scale;
        this.iPosition = this.state.position;
        this.iRotation = this.state.rotation;

        this.pinchStartRotation = e.rotation;

        e.preventDefault();
    }

    handlePinch = (e:any) => {
        const p = this.iPosition;

        this.transition = 'none';

        this.setState({
            position: this.validatePosition(e, [p[0] + e.deltaX, p[1] + e.deltaY]),
            scale: Math.max(Math.min(this.iScale * e.scale, this.params.maxScale as number), this.params.minScale as number),
            rotation: this.iRotation + (e.rotation - this.pinchStartRotation)
        });

        e.preventDefault();
    }

    onWheel = (event:any) => {
        this.restore();

        const delta = Math.sign(event.deltaY);
        const factor = delta * 0.2 * -1;

        this.transition = 'none';

        this.setState({
            scale: Math.max(Math.min(this.state.scale + factor, this.params.maxScale as number), this.params.minScale as number),
        });

        event.preventDefault();
    }

    handleDoubleTap = (e:any) => {
        if(this.props.onMaximize)
            this.props.onMaximize();
    }

    getBoundingRect = (scale:number|null = null) => {
        const r = this.node.getBoundingClientRect();

        if(scale !== null) {
            r.width = (r.width / this.state.scale) * scale; 
            r.height = (r.height / this.state.scale) * scale; 
        }

        return r;
    }

    onMinimized = (e:any = null) => {
        this.setState({
            viewMode: IsleViewModesEnum.Minimized
        });

        if(this.props.onMinimized)
            this.props.onMinimized();
    }

    onAnimationEnd:AnimationEventHandler<HTMLDivElement> | undefined = undefined;

    minimize = (e:any = null) => {
        const { archipelago, k } = this.props;

        this.setState({
           hidingFrame: true,
           rotation: 0
        });

        this.onAnimationEnd = (event) => {
            if((event.target as HTMLDivElement).dataset["tag"] !== "ISLE-HEADER")
                return;

            // Save current state
            this.takeStateShot();

            const r = this.getBoundingRect(1);

            const stackRect = !archipelago ? {
                top: 0,
                left: 0,
                width: 0,
                right: 0
            } : archipelago.getStackBoundingRect();

            const { iconHeight } = this.params;
            const minimizedScale = (iconHeight as number) / r.height;

            const moveTo = [
                (stackRect.left + stackRect.width) + (r.width * minimizedScale / 2 - r.width / 2), 
                stackRect.top + ((iconHeight as number) / 2 - r.height / 2)];

            // Support right to left orientation
            if(archipelago && archipelago.props.stackHorizontalOrientation === "right-left") {
                const archipelagoBoundingRect = archipelago.getBoundingClientRect();

                if(archipelagoBoundingRect)
                   moveTo[0] = (stackRect.left + archipelagoBoundingRect.width - stackRect.width) - (r.width * minimizedScale / 2) - (r.width / 2);
            }

            if(archipelago && k)
                archipelago.minimizeIsle(this, minimizedScale);

            this.transition = 'transform ' + ((this.params.minimizeDurationMs as number) / 1000) + 's';

            this.setState({
                scale: minimizedScale,
                position: moveTo,
                rotation: 0
            });

            if(this.props.onMinimize)
                this.props.onMinimize();

            setTimeout(this.onMinimized, 500);
        }
    }

    onRestored = () => {
        if(this.props.onRestored)
            this.props.onRestored();
    }
        
    restore = () => {
        const { archipelago, k } = this.props;

        if(this.state.viewMode === IsleViewModesEnum.Minimized) {
            if(archipelago && k)
                archipelago.restoreIsle(k, this);

            if(this.stateShot)
                this.stateShot.hidingFrame = false;

            this.restoreState(this.stateShot);

            setTimeout(this.onRestored, 500);
        }
    }

    handleTap = (e:any) => {
        this.bringToFront();
        this.restore();
    }

    bringToFront = () => {
        const { archipelago } = this.props;

        if(archipelago) {
            const zIndex = archipelago.getHighestZIndex();

            this.setState({
                zIndex: (zIndex + 1)
            });
        }
    }

    render() {
        const { viewMode, position, scale, rotation, hidingFrame, zIndex } = this.state;
        const { children, title, className, hideFrame, disableMinimize, disableAutoHideFrame, onMaximize } = this.props;
        
        const style:React.CSSProperties = {
            ...this.props.style,
            transform: 'translate(' + position[0] + 'px, ' + position[1] + 'px) scale(' + scale + ') rotate(' + rotation + 'deg)',
            top: 0,
            left: 0,
            transition: this.transition,
            zIndex: zIndex ? zIndex : 1
        };

        return (
            <Hammer
                options={{
                    domEvents: true,
                    recognizers: {
                        pinch: { enable: true }
                    }
                }}
                onTap={this.handleTap} onDoubleTap={this.handleDoubleTap}
                onPan={this.handlePan} onPanStart={this.handlePanStart} onPanEnd={this.handlePanEnd}
                onPinch={this.handlePinch} onPinchStart={this.handlePinchStart} onPinchEnd={this.handlePinch}>
                <div style={style} onAnimationEnd={this.onAnimationEnd}
                    className={`isle ${valString(className)} ${valBoolean(hideFrame, "no-frame")} ${valBoolean(hidingFrame, "hiding-frame")} 
                        ${valBoolean(!disableAutoHideFrame, "auto-hide-frame")} ${(viewMode === IsleViewModesEnum.Minimized) && "minimized"}`}>
                    { (viewMode === IsleViewModesEnum.Normal && !hideFrame) &&
                        <div className="isle-header" data-tag="ISLE-HEADER">
                            <div className="isle-header-left">
                            </div>

                            <div className="isle-header-center">
                                {title}
                            </div>

                            {(!disableMinimize || onMaximize) &&
                                <div className="isle-header-right">
                                    { onMaximize &&
                                        <div className="maximize-button" onClick={() => onMaximize()}>
                                            {expandSvg}
                                        </div> }
                                        
                                    { !disableMinimize &&
                                        <div className="minimize-button" onClick={this.minimize}>
                                            {xmarkSvg}
                                        </div> }
                                </div> }
                        </div> }

                    <div className="isle-content">
                        { children }
                    </div>
                </div>
            </Hammer>
        );
    }
}