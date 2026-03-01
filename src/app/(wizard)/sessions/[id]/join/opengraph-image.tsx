import { ImageResponse } from "next/og";
import { getSessionOgData } from "@/lib/queries/sessions";

export const alt = "Join Bukber — BookBurr";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function formatDateRange(earliest: string | null, latest: string | null) {
  if (!earliest) return null;
  const fmt = (d: string) => {
    const [, m, day] = d.split("-");
    const months = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
    ];
    return `${parseInt(day)} ${months[parseInt(m) - 1]}`;
  };
  if (!latest || earliest === latest) return fmt(earliest);
  return `${fmt(earliest)} – ${fmt(latest)}`;
}

export default async function OGImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const og = await getSessionOgData(id);

  if (!og) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#FFFFFF",
            fontSize: "48px",
            fontWeight: 700,
            color: "#1a1a1a",
          }}
        >
          BookBurr
        </div>
      ),
      size,
    );
  }

  const dateStr = formatDateRange(og.earliestDate, og.latestDate);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#FFFFFF",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Red accent bar at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            backgroundColor: "#F14641",
            display: "flex",
          }}
        />

        {/* Background circle decoration */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-80px",
            width: "400px",
            height: "400px",
            backgroundColor: "#F14641",
            borderRadius: "50%",
            opacity: 0.06,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            left: "-60px",
            width: "300px",
            height: "300px",
            backgroundColor: "#1B5E3C",
            borderRadius: "50%",
            opacity: 0.05,
            display: "flex",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "64px 80px",
            flex: 1,
            justifyContent: "space-between",
          }}
        >
          {/* Top section: badge + session name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Invite badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  backgroundColor: "#F14641",
                  color: "#FFFFFF",
                  fontSize: "20px",
                  fontWeight: 700,
                  padding: "8px 20px",
                  borderRadius: "100px",
                  display: "flex",
                  letterSpacing: "0.5px",
                }}
              >
                INVITED
              </div>
              {og.hostName && (
                <div
                  style={{
                    fontSize: "22px",
                    color: "#666666",
                    display: "flex",
                  }}
                >
                  by {og.hostName}
                </div>
              )}
            </div>

            {/* Session name */}
            <div
              style={{
                fontSize: og.name.length > 30 ? "56px" : "68px",
                fontWeight: 700,
                color: "#1a1a1a",
                lineHeight: 1.1,
                display: "flex",
                maxWidth: "900px",
              }}
            >
              {og.name.length > 50 ? og.name.slice(0, 47) + "..." : og.name}
            </div>
          </div>

          {/* Bottom section: stats + branding */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            {/* Stats pills */}
            <div style={{ display: "flex", gap: "16px" }}>
              {og.memberCount > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "#F5F5F5",
                    padding: "12px 24px",
                    borderRadius: "100px",
                    fontSize: "24px",
                    color: "#333333",
                    fontWeight: 600,
                  }}
                >
                  <span>👥</span>
                  <span>{og.memberCount} joined</span>
                </div>
              )}
              {dateStr && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "#F5F5F5",
                    padding: "12px 24px",
                    borderRadius: "100px",
                    fontSize: "24px",
                    color: "#333333",
                    fontWeight: 600,
                  }}
                >
                  <span>📅</span>
                  <span>{dateStr}</span>
                </div>
              )}
            </div>

            {/* Branding */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ fontSize: "36px", display: "flex" }}>🔥</div>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: 700,
                  color: "#F14641",
                  display: "flex",
                }}
              >
                BookBurr
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
