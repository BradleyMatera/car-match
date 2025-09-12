#!/usr/bin/env bash
set -euo pipefail

# Update the GitHub Projects (ProjectV2) Roadmap fields (Start/End dates + Status)
# Requires: gh (with repo + project scopes) and jq
# Usage: GH_OWNER=BradleyMatera REPO=car-match PROJECT_NUMBER=3 bash scripts/update_roadmap.sh

command -v gh >/dev/null || { echo "gh CLI not found"; exit 1; }
command -v jq >/dev/null || { echo "jq not found"; exit 1; }

GH_OWNER=${GH_OWNER:-"BradleyMatera"}
REPO_FULL=${REPO_FULL:-"$GH_OWNER/${REPO:-car-match}"}
PROJ_NUM=${PROJECT_NUMBER:-3}

echo "Project owner=$GH_OWNER repo=$REPO_FULL project=$PROJ_NUM"

PROJ_ID=$(gh api graphql -f query='query($login:String!,$number:Int!){ user(login:$login){ projectV2(number:$number){ id title } } }' -f login="$GH_OWNER" -F number=$PROJ_NUM --jq '.data.user.projectV2.id')
FIELDS=$(gh api graphql -f query='query($login:String!,$number:Int!){ user(login:$login){ projectV2(number:$number){ fields(first:50){ nodes{ __typename ... on ProjectV2Field { id name dataType } ... on ProjectV2SingleSelectField { id name options{ id name } } } } } } }' -f login="$GH_OWNER" -F number=$PROJ_NUM --jq '.data.user.projectV2.fields.nodes')

status_field=$(echo "$FIELDS" | jq -r '.[] | select(.name=="Status") | .id')
start_field=$(echo "$FIELDS" | jq -r '.[] | select(.name=="Start date") | .id')
end_field=$(echo "$FIELDS" | jq -r '.[] | select(.name=="End date") | .id')

opt_backlog=$(echo "$FIELDS" | jq -r '.[] | select(.name=="Status") | .options[] | select(.name=="Backlog") | .id')
opt_inprog=$(echo "$FIELDS" | jq -r '.[] | select(.name=="Status") | .options[] | select(.name=="In progress") | .id')
opt_done=$(echo "$FIELDS" | jq -r '.[] | select(.name=="Status") | .options[] | select(.name=="Done") | .id')

wk2_due=$(gh api repos/$REPO_FULL/milestones --jq '.[] | select(.title=="Sept Wk 2") | .due_on' | sed 's/T.*//')
wk3_due=$(gh api repos/$REPO_FULL/milestones --jq '.[] | select(.title=="Sept Wk 3") | .due_on' | sed 's/T.*//')
wk4_due=$(gh api repos/$REPO_FULL/milestones --jq '.[] | select(.title=="Sept Wk 4") | .due_on' | sed 's/T.*//')
wk1_due=2025-09-07

ensure_item(){
  local url="$1"
  gh project item-add --owner "$GH_OWNER" $PROJ_NUM --url "$url" --format json --jq '.id'
}

set_date(){
  local item="$1" field="$2" date="$3"
  [ -z "$date" ] && return 0
  gh api graphql -f query='mutation($project:ID!,$item:ID!,$field:ID!,$date:String!){ updateProjectV2ItemFieldValue(input:{projectId:$project,itemId:$item,fieldId:$field,value:{date:$date}}){ projectV2Item{ id } } }' \
    -f project=$PROJ_ID -f item=$item -f field=$field -f date=$date >/dev/null
}

set_status(){
  local item="$1" opt="$2"
  gh api graphql -f query='mutation($project:ID!,$item:ID!,$field:ID!,$opt:String!){ updateProjectV2ItemFieldValue(input:{projectId:$project,itemId:$item,fieldId:$field,value:{singleSelectOptionId:$opt}}){ projectV2Item{ id } } }' \
    -f project=$PROJ_ID -f item=$item -f field=$status_field -f opt=$opt >/dev/null
}

# Issues to plot on the roadmap
ISSUES=(60 61 62 63 64 65 66 76 77 78 79 80 81)

for num in "${ISSUES[@]}"; do
  data=$(gh api repos/$REPO_FULL/issues/$num)
  url=$(echo "$data" | jq -r '.html_url')
  state=$(echo "$data" | jq -r '.state')
  created=$(echo "$data" | jq -r '.created_at' | sed 's/T.*//')
  closed=$(echo "$data" | jq -r '.closed_at // ""' | sed 's/T.*//')
  mtitle=$(echo "$data" | jq -r '.milestone.title // ""')
  mdue=$(echo "$data" | jq -r '.milestone.due_on // ""' | sed 's/T.*//')
  item=$(ensure_item "$url")

  start="$created"
  if [ "$state" = "closed" ] && [ -n "$closed" ]; then end="$closed"; else
    if [ -n "$mdue" ]; then end="$mdue"; else
      case "$mtitle" in
        "Sept Wk 1") end=$wk1_due;;
        "Sept Wk 2") end=$wk2_due;;
        "Sept Wk 3") end=$wk3_due;;
        "Sept Wk 4") end=$wk4_due;;
        *) end="";;
      esac
    fi
  fi
  set_date "$item" "$start_field" "$start"
  set_date "$item" "$end_field"   "$end"
  if [ "$state" = "closed" ]; then set_status "$item" "$opt_done"; 
  elif [ "$mtitle" = "Sept Wk 2" ]; then set_status "$item" "$opt_inprog"; 
  else set_status "$item" "$opt_backlog"; fi
  echo "Updated #$num: start=$start end=${end:-n/a} state=$state"
done

echo "Roadmap fields populated. In the Project, set a Roadmap view using Start/End date fields."

