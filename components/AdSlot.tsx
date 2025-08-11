"use client";

import { useEffect, useId } from "react";

type Props = { id?: string; slot?: string };

export default function AdSlot({ id, slot }: Props) {
  const internal = useId();

  useEffect(() => {
    try {
      const w = window as unknown as { adsbygoogle: Array<Record<string, unknown>> };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
    } catch {}
  }, []);

  return (
    <div className="my-8 flex justify-center">
      <ins
        id={id || internal}
        className="adsbygoogle block w-full max-w-[728px]"
        style={{ display: "block", minHeight: 250 }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-0000000000000000"}
        data-ad-slot={slot || "0000000000"}
        data-ad-format="auto"
        data-full-width-responsive="true"
        aria-hidden
      />
    </div>
  );
}
