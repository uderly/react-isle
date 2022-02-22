import { IsleViewModesEnum } from "./index";
import { Archipelago } from "./archipelago";

export interface ArchipelagoProps {
    className?: string;
};

export interface IsleParams {
    minScale?: number;
    maxScale?: number;
    scale?: number;
    x?: number;
    y?: number;
    rotation?: number;
    minimizeDurationMs?: number;
    iconHeight?:number;
};

export interface IsleProps {
    className?: string;
    style?: React.CSSProperties|undefined;
    title?: string;
    disableMinimize?: boolean;
    disableMaximize?: boolean;
    disableAutoHideFrame?: boolean;
    hideFrame?: boolean;
    onMaximize?: Function;
    onMinimize?: Function;
    onMinimized?: Function;
    onRestored?: Function;
    archipelago?: Archipelago;
    k?: number;
    params?: IsleParams;
    zIndex?: number;
};

export interface IsleState {
    viewMode: IsleViewModesEnum;
    position: Array<number>;
    scale: number;
    rotation: number;
    hidingFrame: boolean;
    zIndex?: number;
};