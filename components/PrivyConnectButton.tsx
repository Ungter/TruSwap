"use client";

import { usePrivy } from "@privy-io/react-auth";

export const PrivyConnectButton = () => {
    const { login, authenticated, user, logout } = usePrivy();

    if (authenticated) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-sm">
                    {user?.email?.address || user?.wallet?.address?.slice(0, 6) + "..." + user?.wallet?.address?.slice(-4)}
                </span>
                <button className="btn btn-sm btn-outline" onClick={logout}>
                    Logout
                </button>
            </div>
        );
    }

    return (
        <button className="btn btn-primary btn-sm" onClick={login}>
            Login
        </button>
    );
};
