(() => {
  const extensionId = "fbkmdcolngnmmhmdkhngfmdmeofipahp";

  console.log("setting _docs_force_html_by_ext");
  window["_docs_force_html_by_ext"] = extensionId;
  console.log("_docs_force_html_by_ext: " + window["_docs_force_html_by_ext"]);

  window["_docs_annotate_canvas_by_ext"] = extensionId;

  console.log(
    "_docs_annotate_canvas_by_ext: " +
      window["window._docs_annotate_canvas_by_ext"]
  );
})();
