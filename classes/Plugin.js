"use strict";

class Plugin {
  /**
   * Initialize plugin.
   * 
   * @param object models
   *   Object with all models in storage.
   */
  constructor(models) {
    this.models = models;
  }

  /**
   * List fields provided by this plugin.
   * 
   * @return Array
   *   Fields in format "Model.fieldName".
   */
  getFields() {
    return [];
  }

  /**
   * Get value for field provided by this plugin.
   * 
   * @param object models
   *   Object with all models in storage.
   * @param object model
   *   Current model.
   * @param object field
   *   Field object with properties "name", "params", "fields" and "fieldNames".
   * @param string id
   *   Id for currenct object.
   * @param Context context
   *   Query context.
   * 
   * @return mixed
   *   Value or promise for value.
   */
  getValue(models, model, field, id, context) {
    return null;
  }

  /**
   * List models that this plugin does preprocessing for.
   * 
   * Preprocessors are invoked before executing the method
   * and will operate on the method parameters.
   * 
   * @return Array
   *   Model names.
   */
  getPreprocessors() {
    return [];
  }

  /**
   * Execute preprocessing.
   * 
   * @param object models
   *   Object with all models in storage.
   * @param object model
   *   Current model.
   * @param object data
   *   Input data.
   * @param Context context
   *   Query context.
   * 
   * @return object
   *   Updated data or promise for updated data.
   */
  preprocess(models, model, operation, data, context) {
    return data;
  }

  /**
   * List models that this plugin does postprocessing for.
   * 
   * Postprocessing is executed after reading data.
   * 
   * @return Array
   *   Model names.
   */
  getPostprocessors() {
    return [];
  }

  /**
   * Execute postprocessing.
   * 
   * @param object models
   *   Object with all models in storage.
   * @param object model
   *   Current model.
   * @param object data
   *   Input data.
   * @param Context context
   *   Query context.
   * 
   * @return object
   *   Updated data or promise for updated data.
   */
  preprocess(models, model, data, context) {
    return data;
  }
}

module.exports = Plugin;
