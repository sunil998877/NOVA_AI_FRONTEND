import React from "react";
import { PhoneScreen } from "./PhoneScreen";

export function PhoneFeed({ data, dark }) {
  return (
    <div className="flex flex-col pt-16">
      <PhoneScreen data={data} dark={dark} />
      <PhoneScreen data={data} dark={dark} />
    </div>
  );
}
