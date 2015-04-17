/* JSON */
JSON.stringify = JSON.stringify || function(obj) {
	var t = typeof (obj);
	if (t != "object" || obj === null) {
		// simple data type
		if (t == "string")
			obj = '"' + obj + '"';
		return String(obj);
	} else {
		// recurse array or object
		var n, v, json = [], arr = (obj && obj.constructor == Array);
		for (n in obj) {
			v = obj[n];
			t = typeof (v);
			if (t == "string")
				v = '"' + v + '"';
			else if (t == "object" && v !== null)
				v = JSON.stringify(v);
			json.push((arr ? "" : '"' + n + '":') + String(v));
		}
		return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
	}
};

(function($) {
	function XPathFetchModule() {
		this.ui = $("<div>")
				.addClass("module")
				.html(
						"<div>"
								+ "<div class='title ui-widget-header'><span></span>"
								+ "<ul class='buttons'></ul>"
								+ "</div>"
								+ "<div class='content'>"
								+ "<div><span>URL:</span><input name='url' /></div>"
								+ "<div><span>Extract using XPath:<input name='xpath' /></div>"
								+ "<div><span>Use HTML parser</span><input type='checkbox' /></div>"
								+ "<div><span>Emit items as string</span><input type='checkbox' /></div>"
								+ "</div>" + "</div>");

		this.ui.find("div.title>span").text("XPathFetch");
		this.ui.find("ul.buttons").append(
				$("<li>").addClass("minimal ui-icon ui-icon-minus"),
				$("<li>").addClass("remove ui-icon ui-icon-close"));
		
		this.type = 'xpathfetch';
		this.id = null;
		
		this.getConf = function(){
			conf = {};
			conf['URL'] = this.ui.find("input[name='url']").val();
			conf['xpath'] = this.ui.find("input[name='xpath']").val();
			return conf;
		}
	}

	function Editor() {
		this.modules = [];
		this.feedId = null;
		this.init = function() {
			$editor = this;
			$(".control").draggable({
				appendTo : "body",
				opacity : 0.7,
				helper : "clone",
				cursor : "move"
			});

			$("#editor").droppable(
					{
						drop : function(event, ui) {
							controlType = ui.draggable.attr("control-type");
							if (controlType) {
								newControl = $editor.buildModule(controlType);
								$editor.addModule(newControl);

								editorPosition = $("#editor").offset();
								newControl.ui.addClass("editing_control").css(
										"top",
										event.pageY - editorPosition.top - 10)
										.css(
												"left",
												event.pageX
														- editorPosition.left
														- 30).appendTo(this);

								newControl.ui.draggable({
									cursor : "move",
									containment : "#editor",
									scroll : true
								});
							}
						}
					});
		};

		this.addModule = function(module) {
			this.modules.push(module);
			
			module.id = this.generateModuleId();
			
			$editor = this;
			module.ui.find(".buttons .remove").click(function(){
				$editor.removeModule(module);
			})
		};
		
		this.removeModule = function(module){
			for(i=0;i<this.modules.length;i++){
				if (module == this.modules[i]){
					this.modules.pop(module);
					module.ui.remove();
					break;
				}
			}
		}

		this.buildModule = function(moduleType) {
			module = null;
			switch (moduleType) {
			case "xpathfetch":
				module = new XPathFetchModule;
				break;
			}
			
			return module;
		};
		
		this.generateModuleId = function(){
			min = 0;
			max = this.modules.length + 1;
			while(true){
				newId = 'm' + Math.floor(Math.random() * (max - min)) + min;
				found = false;
				for(i=0;i<this.modules.length;i++){
					if(this.modules[i].id == newId){
						found = true;
						break;
					}
				}
				if(!found){
					return newId;
				}
			}
			
		}

		this.toJson = function() {
			var obj = {'feed_id' : this.feedId};
			obj['modules'] = []
			for (i = 0; i < this.modules.length; i++) {
				obj['modules'].push({
					'type' : this.modules[i].type,
					'id' : this.modules[i].id,
					'conf' : this.modules[i].getConf()
				});
			}
			return JSON.stringify(obj);
		}
		
		this.save = function(){
			$editor = this;
			$.ajax({
				url:		'/feeds/save',
				method: 'post',
				data: {'feedinfo' : editor.toJson()},
				dataType: 'json',
				error : function(){
						console.log("error");
				},
				success : function(data){
						console.log("success");
						$editor.feedId = data['feed_id']
				}
		});
		} 
	}

	$.fn.editor = function(options) {
		var settings = $.extend({}, options);
		$("#div_left_menu").accordion();
		var editor = new Editor;
		editor.init();
		return editor;
	};
}(jQuery));
