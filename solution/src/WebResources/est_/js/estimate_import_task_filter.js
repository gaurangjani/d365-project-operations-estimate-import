// Filters the Project Task lookup on the Estimate Import form to only
// show tasks belonging to the currently selected Project.
// Field names: est_project (lookup -> msdyn_project), est_projecttask (lookup -> msdyn_projecttask).
// msdyn_projecttask's own parent-project field is msdyn_project.
"use strict";

var Community = Community || {};
Community.EstimateImport = Community.EstimateImport || {};

(function () {

    function onPreSearchProjectTask(executionContext) {
        var formContext = executionContext.getFormContext();
        var control = formContext.getControl("est_projecttask");
        var projectAttr = formContext.getAttribute("est_project");
        var projectRef = projectAttr ? projectAttr.getValue() : null;

        if (!projectRef || projectRef.length === 0 || !control) {
            return;
        }

        var projectId = projectRef[0].id.replace("{", "").replace("}", "");
        var fetchXml =
            "<filter type='and'>" +
            "<condition attribute='msdyn_project' operator='eq' uitype='msdyn_project' value='" + projectId + "' />" +
            "</filter>";

        control.addCustomFilter(fetchXml, "msdyn_projecttask");
    }

    function applyProjectTaskFilter(executionContext) {
        var formContext = executionContext.getFormContext();
        var control = formContext.getControl("est_projecttask");
        if (!control) {
            return;
        }

        control.removePreSearch(onPreSearchProjectTask);

        var projectAttr = formContext.getAttribute("est_project");
        var projectRef = projectAttr ? projectAttr.getValue() : null;

        if (projectRef && projectRef.length > 0) {
            control.addPreSearch(onPreSearchProjectTask);
        }
    }

    function onProjectChange(executionContext) {
        var formContext = executionContext.getFormContext();
        applyProjectTaskFilter(executionContext);

        // If a Task is already selected and the Project just changed, it may no
        // longer belong to the new Project. Clear it so the user re-picks a valid
        // one rather than silently keeping a mismatched Task/Project pair.
        var taskAttr = formContext.getAttribute("est_projecttask");
        if (taskAttr && taskAttr.getValue()) {
            taskAttr.setValue(null);
        }
    }

    function onFormLoad(executionContext) {
        applyProjectTaskFilter(executionContext);
    }

    Community.EstimateImport.onFormLoad = onFormLoad;
    Community.EstimateImport.onProjectChange = onProjectChange;

})();
