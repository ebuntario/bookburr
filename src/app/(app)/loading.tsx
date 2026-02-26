import { Spinner } from "@heroui/react";

export default function AppLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner size="lg" color="warning" />
    </div>
  );
}
