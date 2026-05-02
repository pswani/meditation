claude --dangerously-skip-permissions -p "$(cat             
  prompts/session-d-issue-6-monster-file-splits.md)" >> /tmp/session-d.log 2>&1

claude --verbose -p "Review the deployment architecture of the application and make recommendations if this is the best setup to run on the mac and save it to a md file" >> /tmp/dep-arch.log 2>&1

claude --verbose -p "Review the build scripts thoroughly.  Check if they follow the best practices? Are they good for this kind of application?  Do we need to redesign the scripts and rebuild?  Or would just making improvements would make them best in class? and save it to a md file" >> /tmp/build-scr.log 2>&1

claude --verbose -p "Thoroughly Review my agentic usage and make recommendations for improvement to make the best use of the AI capabilities. and save it to a md file" >> /tmp/agentic-usage.log 2>&1

claude --verbose -p "Analyze the CODE-REVIEW-2026-04-24.md file to analyze, design and plan for the Backend & Database issues (High medium and low) and save it to a md file. Create the prompt files for fixing as many issues possible in a single session. Dont make any code changes. Suggest what permissions will be required by claude to implement these changes." >> /tmp/plan-db-backend.log 2>&1