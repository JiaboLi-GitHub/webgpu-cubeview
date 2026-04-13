import { JSX as JSX_2 } from 'react/jsx-runtime';

export declare function CubeViewComponent({ width, height, onAngleChange, className, style, }: CubeViewProps): JSX_2.Element;

export declare interface CubeViewProps {
    width?: number;
    height?: number;
    onAngleChange?: (phi: number, theta: number) => void;
    className?: string;
    style?: React.CSSProperties;
}

export { }
