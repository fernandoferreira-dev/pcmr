import * as React from "react";
import "../assets/styles/index.css"

type ButtonProps = {
    children: React.ReactNode;
    width?: string;
};

function Button({ children }: ButtonProps) {
    return (
        <button className="bg-background text-text font-sans">
            {children}
        </button>
    );
}

export default Button;