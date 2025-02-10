import { format } from "date-fns";

// Define the possible unit types as a TypeScript union type
type TimeUnit = "minute" | "hour" | "day" | "week" | "month" | "default";

export default function formatTime(
  dateString: string,
  timeString: string,
  unit: TimeUnit
): string {
  // Combine date and time into a valid ISO 8601 format
  const combinedDateTime = `${dateString}T${timeString}`;

  // Create a Date object from the combined string
  const date = new Date(combinedDateTime);

  // Check if the resulting date is valid
  if (isNaN(date.getTime())) {
    console.error(`Invalid date or time: ${combinedDateTime}`);
    return "Invalid Date";
  }

  // Format the date based on the specified unit
  switch (unit) {
    case "minute":
      return format(date, "HH:mm");
    case "hour":
      return format(date, "HH:mm");
    case "day":
      return format(date, "MMM dd");
    case "week":
      return format(date, "'Week of' MMM dd");
    case "month":
      return format(date, "yyyy MMM");
    default:
      return format(date, "yyyy-MM-dd HH:mm");
  }
}
