import { power_user } from "/app/systems/power-user";
import { substituteParams } from "/script";

/**
 * Showdown extension to make chat separators (dinkuses) ignore markdown formatting
 * @returns {import('showdown').ShowdownExtension[]} An array of Showdown extensions
 */
export const markdownExclusionExt = () => {
  if (!power_user) {
    console.log("Showdown-dinkus extension: power_user wasn't found! Returning.");
    return [];
  }

  // The extension will only be applied if the user has non-empty "Non-markdown strings"
  // Changing the string in the UI reloads the processor, so we don't need to worry about it
  if (!power_user.markdown_escape_strings) {
    return [];
  }

  // Escape the strings to be excluded from markdown parsing
  // Function is evaluated every time, so we don't care about stale macros in the strings
  return [
    {
      type: "lang",
      filter: (text: any) => {
        const escapedExclusions = substituteParams(power_user.markdown_escape_strings)
          .split(",")
          .filter((element: any) => element.length > 0)
          .map(
            (element: any) =>
              `(${element
                .split("")
                .map((char: any) => `\\${char}`)
                .join("")})`,
          );

        // No exclusions? No extension!
        if (escapedExclusions.length === 0) {
          return text;
        }

        const replaceRegex = new RegExp(`^(${escapedExclusions.join("|")})\n`, "gm");
        return text.replace(replaceRegex, (match: any) => match.replace(replaceRegex, `\u0000${match} \n`));
      },
    },
  ];
};
