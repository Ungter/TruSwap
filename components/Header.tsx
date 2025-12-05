"use client";

import Link from "next/link";
import { PrivyConnectButton } from "./PrivyConnectButton";

export const Header = () => {
    return (
        <div className="header-glass sticky top-0 z-50">
            <div className="navbar min-h-0 flex-shrink-0 justify-between px-4 sm:px-6 py-3">
                <div className="navbar-start w-auto lg:w-1/2">
                    <Link href="/" className="flex items-center gap-3 shrink-0 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0052ff] to-[#9945ff] flex items-center justify-center shadow-lg shadow-[#0052ff]/20">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className="w-5 h-5 text-white"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <span className="font-bold text-lg gradient-text group-hover:opacity-80 transition-opacity">
                            CrossPay
                        </span>
                    </Link>
                </div>
                <div className="navbar-end flex-grow">
                    <PrivyConnectButton />
                </div>
            </div>
        </div>
    );
};
