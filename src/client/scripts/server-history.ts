import { saveSettingsDebounced } from "../script";
import { power_user } from "./power-user";
import { isValidUrl } from "./utils";

/**
 * @param {{ term: string; }} request
 * @param {function} resolve
 * @param {string} serverLabel
 */
function findServers(request: any, resolve: any, serverLabel: any) {
  if (!power_user.servers) {
    power_user.servers = [];
  }

  const needle = request.term.toLowerCase();
  const result = power_user.servers
    .filter((x: any) => x.label == serverLabel)
    .sort((a: any, b: any) => b.lastConnection - a.lastConnection)
    .map((x: any) => x.url)
    .slice(0, 5);
  const hasExactMatch = result.findIndex((x: any) => x.toLowerCase() == needle) !== -1;

  if (request.term && !hasExactMatch) {
    result.unshift(request.term);
  }

  resolve(result);
}

function selectServer(event: any, ui: any, serverLabel: any) {
  // unfocus the input
  $(event.target).val(ui.item.value).trigger("input").trigger("blur");

  $("[data-server-connect]").each(function () {
    const serverLabels = String($(this).data("server-connect")).split(",");

    if (serverLabels.includes(serverLabel)) {
      $(this).trigger("click");
    }
  });
}

function createServerAutocomplete(this: any) {
  const inputElement = $(this);
  const serverLabel = inputElement.data("server-history");

  inputElement
    .autocomplete({
      source: (i: any, o: any) => findServers(i, o, serverLabel),
      select: (e: any, u: any) => selectServer(e, u, serverLabel),
      minLength: 0,
    })
    .on("focus", onInputFocus); // <== show tag list on click
}

function onInputFocus(this: any) {
  $(this).autocomplete("search", $(this).val());
}

function onServerConnectClick(this: any) {
  const serverLabels = String($(this).data("server-connect")).split(",");

  serverLabels.forEach((serverLabel) => {
    if (!power_user.servers) {
      power_user.servers = [];
    }

    const value = String($(`[data-server-history="${serverLabel}"]`).val())
      .toLowerCase()
      .trim();

    // Don't save empty values or invalid URLs
    if (!value || !isValidUrl(value)) {
      return;
    }

    const server = power_user.servers.find((x: any) => x.url === value && x.label === serverLabel);

    if (!server) {
      power_user.servers.push({ label: serverLabel, url: value, lastConnection: Date.now() });
    } else {
      server.lastConnection = Date.now();
    }

    saveSettingsDebounced();
  });
}

export function initServerHistory() {
  $("[data-server-history]").each(createServerAutocomplete);
  $(document).on("click", "[data-server-connect]", onServerConnectClick);
}
