import * as React from "react";
import "../assets/styles/index.css"

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode;
    width?: string;
};

function Button({ children, className, ...rest }: ButtonProps) {
    return (
        <button
            className={`bg-primary text-background font-sans font-semibold rounded-full py-3 px-6 transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${className ?? ""}`}
            {...rest}
        >
            {children}
        </button>
    );
}

export default Button;
