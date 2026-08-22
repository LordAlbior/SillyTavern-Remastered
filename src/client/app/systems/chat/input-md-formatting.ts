import { power_user } from "/app/systems/power-user";

export function initInputMarkdown() {
  $(document).on("keydown", "textarea.mdHotkeys", function (e) {
    if (!power_user.enable_md_hotkeys) {
      return;
    }
    if (!(this instanceof HTMLTextAreaElement)) {
      return;
    }

    // Early return on only control or no control, alt key, and win/cmd key
    if (
      e.key === "Control" ||
      !e.ctrlKey ||
      e.altKey ||
      e.metaKey ||
      (e.shiftKey && !(e.ctrlKey && e.shiftKey && e.code === "Backquote"))
    ) {
      return;
    }
    let charsToAdd = "";
    let possiblePreviousFormattingMargin = 1;

    switch (true) {
      case e.ctrlKey && e.shiftKey && e.code === "Backquote":
        e.preventDefault();
        e.stopPropagation();
        charsToAdd = "~~";
        possiblePreviousFormattingMargin = 2;
        break;
      case e.ctrlKey && e.code === "KeyB":
        e.preventDefault();
        e.stopPropagation();
        charsToAdd = "**";
        possiblePreviousFormattingMargin = 2;
        break;
      case e.ctrlKey && e.code === "KeyI":
        e.preventDefault();
        e.stopPropagation();
        charsToAdd = "*";
        break;
      case e.ctrlKey && e.code === "KeyU":
        e.preventDefault();
        e.stopPropagation();
        charsToAdd = "__";
        possiblePreviousFormattingMargin = 2;
        break;
      case e.ctrlKey && e.code === "KeyK":
        e.preventDefault();
        e.stopPropagation();
        charsToAdd = "`";
        break;
      default:
        return; // Early return if no key matches
    }

    let selectedText = "";
    const start = this.selectionStart;
    let end = this.selectionEnd;
    const beforeCaret = this.value.substring(start - 1, start);
    const afterCaret = this.value.substring(end, end + 1);
    const isTextSelected = start !== end;
    let cursorShift = charsToAdd.length;
    const selectedTextandPossibleFormatting = this.value
      .substring(start - possiblePreviousFormattingMargin, end + possiblePreviousFormattingMargin)
      .trim();

    if (isTextSelected) {
      //if text is selected
      selectedText = this.value.substring(start, end);
      if (selectedTextandPossibleFormatting === charsToAdd + selectedText + charsToAdd) {
        // If the selected text is already formatted, remove the formatting

        let expandedStart = start - charsToAdd.length;
        let expandedEnd = end + charsToAdd.length;

        // Ensure expanded range is within the bounds of the text
        if (expandedStart < 0) expandedStart = 0;
        if (expandedEnd > this.value.length) expandedEnd = this.value.length;

        // Select the expanded range
        this.setSelectionRange(expandedStart, expandedEnd);

        // Replace the expanded selection with the original selected text
        document.execCommand("insertText", false, selectedText);
        // Adjust cursor position
        cursorShift = -charsToAdd.length;
      } else {
        // Add formatting to the selected text
        let possibleAddedSpace = "";
        if (selectedText.endsWith(" ")) {
          possibleAddedSpace = " ";
          selectedText = selectedText.substring(0, selectedText.length - 1);
          end--; // Adjust the end index since we removed the space
        }
        // To add the formatting, we need to select the text first
        this.focus();
        document.execCommand("insertText", false, charsToAdd + selectedText + charsToAdd + possibleAddedSpace);
      }
    } else {
      // No text is selected
      //check 1 character before and after the cursor for non-space characters

      if (beforeCaret !== " " && afterCaret !== " " && afterCaret !== "" && beforeCaret !== "") {
        //look for caret in the middle of a word
        //expand the selection range until the next space on both sides
        let midCaretExpandedStart = start - 1;
        let midCaretExpandedEnd = end + 1;
        while (
          midCaretExpandedStart > 0 &&
          this.value.substring(midCaretExpandedStart - 1, midCaretExpandedStart) !== " "
        ) {
          midCaretExpandedStart--;
        }
        while (
          midCaretExpandedEnd < this.value.length &&
          this.value.substring(midCaretExpandedEnd, midCaretExpandedEnd + 1) !== " "
        ) {
          midCaretExpandedEnd++;
        }
        //make a selection of the discovered word
        this.setSelectionRange(midCaretExpandedStart, midCaretExpandedEnd);
        //set variables for comparison
        const discoveredWordWithPossibleFormatting = this.value
          .substring(midCaretExpandedStart, midCaretExpandedEnd)
          .trim();
        let discoveredWord = "";

        if (
          discoveredWordWithPossibleFormatting.endsWith(charsToAdd) &&
          discoveredWordWithPossibleFormatting.startsWith(charsToAdd)
        ) {
          discoveredWord = this.value
            .substring(midCaretExpandedStart + charsToAdd.length, midCaretExpandedEnd - charsToAdd.length)
            .trim();
        } else {
          discoveredWord = this.value.substring(midCaretExpandedStart, midCaretExpandedEnd).trim();
        }

        if (charsToAdd + discoveredWord + charsToAdd === discoveredWordWithPossibleFormatting) {
          // Replace the expanded selection with the original discovered word
          this.focus();
          document.execCommand("insertText", false, discoveredWord);
          // Adjust cursor position
          cursorShift = -charsToAdd.length;
        } else {
          //format did not previously exist, so add it
          this.focus();
          document.execCommand("insertText", false, charsToAdd + discoveredWord + charsToAdd);
        }
      } else {
        //caret is not inside a word, so just add the formatting
        this.focus();
        this.setSelectionRange(start, end);
        selectedText = this.value.substring(start, end);
        document.execCommand("insertText", false, charsToAdd + selectedText + charsToAdd);
      }
    }

    // Manually trigger the 'input' event to make undo/redo work
    const event = new Event("input", { bubbles: true });
    this.dispatchEvent(event); // This notifies the browser of a change, allowing undo/redo to function.

    // Update the cursor position
    if (isTextSelected) {
      this.selectionStart = start + cursorShift;
      this.selectionEnd = start + cursorShift + selectedText.length;
    } else {
      this.selectionStart = start + cursorShift;
      this.selectionEnd = start + cursorShift;
    }
  });
}
