#!/usr/bin/env bash
set -euo pipefail

# Update GitHub Project items for BradleyMatera/projects/3
# Requires: gh CLI with 'project' scope and jq installed

OWNER=${OWNER:-"BradleyMatera"}
NUMBER=${NUMBER:-"3"}

echo "Ensuring gh CLI has 'project' scope..."
if ! gh auth status 2>/dev/null | rg -q "project"; then
  echo "Your gh token is missing 'project' scope. Run: gh auth refresh -h github.com -s project"
  exit 1
fi

echo "Fetching project metadata for $OWNER/projects/$NUMBER ..."
PROJECT_JSON=$(gh project view "$NUMBER" --owner "$OWNER" --format json)
PROJECT_ID=$(jq -r '.id' <<< "$PROJECT_JSON")
echo "Project ID: $PROJECT_ID"

FIELDS_JSON=$(gh project field-list "$NUMBER" --owner "$OWNER" --format json)

get_field_id() { # name
  jq -r --arg n "$1" '.fields[] | select(.name == $n) | .id' <<< "$FIELDS_JSON"
}
get_status_option_id_exact() { # option name exact
  jq -r --arg n "$1" '.fields[] | select(.name == "Status") | .options[] | select(.name == $n) | .id' <<< "$FIELDS_JSON"
}
get_status_option_id_fuzzy() { # desired semantic bucket: TODO|INPROGRESS|DONE
  local kind=$(echo "$1" | tr '[:upper:]' '[:lower:]')
  local all=$(jq -r '.fields[] | select(.name == "Status") | [.options[].name] | @json' <<< "$FIELDS_JSON")
  # strip quotes and brackets
  local opts; opts=$(jq -r '.[]' <<< "$all")
  while read -r opt; do
    local o=$(echo "$opt" | tr '[:upper:]' '[:lower:]')
    case "$kind" in
      todo)
        if [[ "$o" =~ ^(to do|todo|not started|backlog|ready|up next)$ ]]; then echo "$opt"; return 0; fi ;;
      inprogress)
        if [[ "$o" =~ ^(in progress|doing|working|active|progress)$ ]]; then echo "$opt"; return 0; fi ;;
      done)
        if [[ "$o" =~ ^(done|completed|closed|finished|shipped|merged)$ ]]; then echo "$opt"; return 0; fi ;;
    esac
  done <<< "$opts"
  # fallback: first option
  echo "$opts" | head -n1
}

STATUS_FIELD_ID=$(get_field_id "Status" || true)
if [[ -z "${STATUS_FIELD_ID:-}" ]]; then
  echo "Status field not found. Create a 'Status' single-select field in the project first."
  exit 1
fi

set_status() { # itemId, statusSemanticOrName
  local ITEM_ID="$1"; local STATUS_NAME="$2";
  local OPT_ID
  OPT_ID=$(get_status_option_id_exact "$STATUS_NAME")
  if [[ -z "$OPT_ID" || "$OPT_ID" == "null" ]]; then
    # try fuzzy mapping
    local semantic
    case "$(echo "$STATUS_NAME" | tr '[:upper:]' '[:lower:]')" in
      todo|to\ do|not\ started|backlog|ready) semantic="todo";;
      in\ progress|doing|working|active|progress) semantic="inprogress";;
      done|completed|closed|finished|shipped|merged) semantic="done";;
      *) semantic="todo";;
    esac
    local FUZZY_NAME; FUZZY_NAME=$(get_status_option_id_fuzzy "$semantic")
    OPT_ID=$(get_status_option_id_exact "$FUZZY_NAME")
  fi
  if [[ -z "$OPT_ID" || "$OPT_ID" == "null" ]]; then
    echo "Status option mapping failed for '$STATUS_NAME' on item $ITEM_ID" >&2
    return 0
  fi
  gh project item-edit --id "$ITEM_ID" --project-id "$PROJECT_ID" --field-id "$STATUS_FIELD_ID" --single-select-option-id "$OPT_ID" >/dev/null
}

add_issue_url() { # url, status
  local URL="$1"; local STATUS="$2";
  echo "Adding $URL ..."
  local ITEM_JSON; ITEM_JSON=$(gh project item-add "$NUMBER" --owner "$OWNER" --url "$URL" --format json)
  local ITEM_ID; ITEM_ID=$(jq -r '.id' <<< "$ITEM_JSON")
  set_status "$ITEM_ID" "$STATUS"
}

add_draft() { # title, body, status
  local TITLE="$1"; local BODY="$2"; local STATUS="$3";
  echo "Creating draft: $TITLE ..."
  local ITEM_JSON; ITEM_JSON=$(gh project item-create "$NUMBER" --owner "$OWNER" --title "$TITLE" --body "$BODY" --format json)
  local ITEM_ID; ITEM_ID=$(jq -r '.id' <<< "$ITEM_JSON")
  set_status "$ITEM_ID" "$STATUS"
}

# Add recent PR and issue
add_issue_url "https://github.com/BradleyMatera/car-match/pull/41" "Done" || true
add_issue_url "https://github.com/BradleyMatera/car-match/issues/42" "Todo" || true
add_issue_url "https://github.com/BradleyMatera/car-match/issues/43" "Todo" || true
add_issue_url "https://github.com/BradleyMatera/car-match/issues/44" "Todo" || true

# Align statuses for existing items by URL or title
ITEMS_JSON=$(gh project item-list "$NUMBER" --owner "$OWNER" --format json)

set_status_by_url() { # url, status
  local URL="$1"; local STATUS="$2"
  local ID
  ID=$(jq -r --arg u "$URL" '.items[] | select(.content != null and .content.url == $u) | .id' <<< "$ITEMS_JSON")
  if [[ -n "$ID" && "$ID" != "null" ]]; then set_status "$ID" "$STATUS"; fi
}
set_status_by_title() { # title, status
  local TITLE="$1"; local STATUS="$2"
  local ID
  ID=$(jq -r --arg t "$TITLE" '.items[] | select(.type=="DRAFT_ISSUE" and .title == $t) | .id' <<< "$ITEMS_JSON")
  if [[ -n "$ID" && "$ID" != "null" ]]; then set_status "$ID" "$STATUS"; fi
}

set_status_by_url "https://github.com/BradleyMatera/car-match/pull/41" "Done"
set_status_by_url "https://github.com/BradleyMatera/car-match/issues/42" "Todo"
set_status_by_url "https://github.com/BradleyMatera/car-match/issues/43" "Done"
set_status_by_url "https://github.com/BradleyMatera/car-match/issues/44" "Done"

set_status_by_title "Deploy backend to Render" "In Progress"
set_status_by_title "Wire frontend to backend URL" "Todo"
set_status_by_title "Enable real events in production" "Todo"
set_status_by_title "Tighten CORS and secrets" "Done"
set_status_by_title "Address Dependabot alerts" "Todo"

# Draft tasks to fully "make it real"
add_draft "Deploy backend to Render" $'Use render.yaml -> create web service in backend/. Set JWT_SECRET env. After deploy, copy URL.' "In Progress" || true
add_draft "Wire frontend to backend URL" $'Set repo variable REACT_APP_API_BASE_URL to your Render URL. Optional REACT_APP_USE_REAL_EVENTS=true' "Todo" || true
add_draft "Enable real events in production" $'Flip REACT_APP_USE_REAL_EVENTS=true once backend events are ready.' "Todo" || true
add_draft "Tighten CORS and secrets" $'Lock CORS to Pages origin; move JWT_SECRET from default. Consider rate limiting.' "Todo" || true
add_draft "Address Dependabot alerts" $'Track in issue #42. Perform safe upgrades; keep build green.' "Todo" || true

echo "Project updates complete."
