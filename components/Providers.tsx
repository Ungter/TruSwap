"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import dynamic from "next/dynamic";

const PrivyProviderWrapper = dynamic(
    () => import("./PrivyProviderWrapper").then((mod) => mod.PrivyProviderWrapper),
    { ssr: false },
);

export const Providers = ({ children }: { children: React.ReactNode }) => {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <PrivyProviderWrapper>{children}</PrivyProviderWrapper>
        </QueryClientProvider>
    );
};
