import { CrossChainBridge } from "@/components/CrossChainBridge";

export default function Home() {
  return (
    <>
      {/* Animated Background */}
      <div className="mesh-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="flex items-center flex-col grow pt-16 pb-12 relative z-10">
        <div className="px-5 w-full max-w-6xl">
          <h1 className="text-center mb-12">
            <span className="block text-5xl font-bold gradient-text-brand mb-3">
              Cross-Chain Payments
            </span>
            <span className="block text-lg text-white/60">
              Swap & Bridge USDC between Base and Solana seamlessly
            </span>
          </h1>

          <div className="flex justify-center w-full">
            <CrossChainBridge />
          </div>

          {/* Footer Info */}
          <div className="flex justify-center gap-8 mt-16 text-sm text-white/40">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#14f195]" />
              Powered by Circle CCTP
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#0052ff]" />
              KyberSwap & Jupiter
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
