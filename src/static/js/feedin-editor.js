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

		this.getConf = function() {
			conf = {};
			conf['URL'] = this.ui.find("input[name='url']").val();
			conf['xpath'] = this.ui.find("input[name='xpath']").val();
			return conf;
		}
		
		this.setConf = function(conf){
			if (conf['URL']){
				this.ui.find("input[name='url']").val(conf['URL']);
			}
			
			if(conf['xpath']){
				this.ui.find("input[name='xpath']").val(conf['xpath']);
			}
		}

		this.terminals = [ {
			'name' : '_OUTPUT'
		} ];
		this.getTerminals = function() {
			return this.terminals;
		}
	}

	function Editor() {
		this.modules = [];
		this.feedId = null;
		this.init = function(settings) {
			this.settings = settings;
			$editor = this;
			$(".control").draggable({
				appendTo : "body",
				opacity : 0.7,
				helper : "clone",
				cursor : "move"
			});
			
			this.editingRegion = settings['editingRegion'];

			$("#editor").droppable(
					{
						drop : function(event, ui) {
							controlType = ui.draggable.attr("control-type");
							if (controlType) {
								newControl = $editor.buildModule(controlType);
								$editor.addModule(newControl);

								editorPosition = $("#editor").offset();
								newControl.ui.css("top",event.pageY - editorPosition.top - 10)
										.css("left",event.pageX	- editorPosition.left- 30);

								
							}
						}
					});
		};

		this.addModule = function(module) {
			this.modules.push(module);

			if(!module.id){
				module.id = this.generateModuleId();
			}
			$editor = this;
			module.ui.find(".buttons .remove").click(function() {
				$editor.removeModule(module);
			})
			
			module.ui.addClass("editing_control");
			
			module.ui.draggable({
									cursor : "move",
									containment : "#editor",
									scroll : true
								});
			
			module.ui.css("position", "absolute");
			
			this.editingRegion.append(module.ui);
			
			
		};

		this.removeModule = function(module) {
			this.modules.pop(module);
			module.ui.remove();
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

		this.generateModuleId = function() {
			min = 0;
			max = this.modules.length + 1;
			while (true) {
				newId = 'm' + (Math.floor(Math.random() * (max - min)) + min);
				found = false;
				for (module in this.modules) {
					if (module.id == newId) {
						found = true;
						break;
					}
				}
				if (!found) {
					return newId;
				}
			}

		}

		this.toJson = function() {
			var obj = {
				'feed_id' : this.feedId
			};
			obj['modules'] = []
			obj['layout'] = []
			for (i in this.modules) {
				module = this.modules[i];
				obj['modules'].push({
					'type' : module.type,
					'id' : module.id,
					'conf' : module.getConf()
				});
				
				obj['layout'].push({
					'id' : module.id,
					'xy' : [module.ui.position().left, 
					        module.ui.position().top]
				});
			}
			return JSON.stringify(obj);
		}

		this.save = function() {
			$editor = this;
			$.ajax({
				url : $editor.settings['saveUrl'],
				method : 'post',
				data : {
					'feedinfo' : editor.toJson()
				},
				dataType : 'json',
				error : function() {
					console.log("error");
				},
				success : function(data) {
					console.log("success");
					$editor.feedId = data['feed_id']
				}
			});
		};
		
		this._loadFeedData = function(data){
			this.feedId = data['feed_id'];
			for(i=0;i<data['modules'].length;i++){
				moduleInfo = data['modules'][i];
				module = this.buildModule(moduleInfo.type);
				module.id = moduleInfo.id;
				module.setConf(moduleInfo.conf);
				this.addModule(module);
				
				if (data['layout']){
					for(j=0;j<data['layout'].length;j++){
						if (data['layout'][j].id == module.id){
							module.ui.css("left", data['layout'][j].xy[0]);
							module.ui.css("top", data['layout'][j].xy[1]);
						}
					}
				}
			}
		}

		this.load = function(id) {
			$editor = this;
			$.ajax({
				url : $editor.settings['loadUrl'],
				method : 'get',
				data : {
					'id' : id
				},
				dataType : 'json',
				error : function() {
					console.log("error");
				},
				success : function(data) {
					console.log("success");
					$editor._loadFeedData(data);
				}
			});
		}
	}

	$.fn.editor = function(options) {
		var settings = $.extend({
			'saveUrl' : '/feeds/save', 
			'loadUrl' : '/feeds/load'
		}, options);
		settings['editingRegion'] = this;
		$("#div_left_menu").accordion();
		var editor = new Editor;
		editor.init(settings);
		return editor;
	};
}(jQuery));
