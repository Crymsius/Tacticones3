/* Explications des variables globales :

- nbrNotif: compte le nombre de notifications, est uniquement incrémentée lors de la création d'une nouvelle notif. 
Vaut 1 à la création.


- addNotif: permet de déterminer si on ajoute ou si on modifie une notification, l'écran étant le même il faut savoir dans quel cas on se trouve.
1 <=> Création
2 <=> Modification
0 <=> Rien (est remise à 0 après création / modification pour ne pas réaliser l'autre traitement dans la foulée.)


- Nouvelle Notif: array qui contient les infos essentielles des notifications : 

[0,1,2,...,n]
 	 |
 	 v
   {nom, typeNotif, messageTactile, actif}
	 |		|			  |		  	  |
	 v 		v 			  v 		  v
   string  string        int        0 ou 1
					(l'indice du msge dans l'array listeMessageTactile)


- num : numéro de la notification récupérée pour modifier les valeurs de celle-ci.


- app : variable qui contient toutes les fonctions du programme. Est appelée par le fichier html via app.initialize.
*/


var nbrNotif = 1; //compte le nbr de notifs
var NouvelleNotif = [];
function Notification () {
    this.nom = "";
    this.typeNotif = "";
    this.messageTactile = [];
    this.actif = 0;
};

var dureeMsg = 3000;
var msgeTact = [];
var listeMessageTactile = [];
function MsTact () {
	this.nom = "";
	this.messageTactile = [];
};

var app = {
	initialize: function() {	//Fonction d'initialisation
	    this.bindEvents();
	    $("#connecte").hide();
	    this.startApp();
	    line = new ProgressBar.Line('#container', {
	    	duration: dureeMsg,
	    	color: '#FCB03C'
	  	});
	},

	bindEvents: function() {	//bind tous les events/clics/swipe/bouttons/etc.
	    document.addEventListener('deviceready', this.onDeviceReady, false);
	    $("#refreshButton").bind('tap', this.refreshDeviceList);
	    $("#closeButton").bind('tap', this.disconnect);
	    $("#deviceList").bind('tap', this.connect);
	    $("#createNotif").bind('tap', this.createNotif);
		$("#modifyNotif").bind('tap', this.modifyNotif);
	    $("#EnregistrerNotif").bind('tap', this.SaveNotif);
	    $("#start").bind('tap', this.messageTactile);
	    $("#saveMessageTactile").bind('tap', this.SaveMessageTactile);
	    $("#annuler").bind('tap', function(){ $("#popupMessageTactile").popup("close")});
	    
	    
	    this.bindSliders(0);
		$(document).off('click', "#listeNotifModifier li").on('click', "#listeNotifModifier li", function (event){
			listitem = $(this);
			app.listModify();
		});
		$(document).on("swipeleft swiperight", "#listeNotifModifier li", function(event){
			listitem = $(this);
			app.supprNotif(event);
		});
		//$("#caca").bind('tap',this.sendData(msgeTact1));

	},

	bindSliders: function(i) {	//bind le slider-i et envoie l'état dans la notification i (NouvelleNotif[i].actif)
		$(document).on('slidestop',"#slider-"+i, function(event){
			NouvelleNotif[i].actif= this.value;
		});
	},

	startApp: function() {	
		
	    //initialisation des messages tactiles par défauts.
	    msgeTact=[[1,3000],[1,3000]];
		listeMessageTactile[0] = new MsTact;
		listeMessageTactile[0].nom = 'Non-Stop';
		listeMessageTactile[0].messageTactile = msgeTact;
		msgeTact=[];

		msgeTact=[[1,500,1000,1500,2000,2500],[500,1000,1500,2000,2500,3000]];
		listeMessageTactile[1] = new MsTact;
		listeMessageTactile[1].nom = 'Alternance';
		listeMessageTactile[1].messageTactile = msgeTact;
		msgeTact=[];

		//initialisation de la notif 0 (pour avoir une notif par défaut lors du premier lancement)
		NouvelleNotif[0] = new Notification;
	    NouvelleNotif[0].nom = 'J.Fedjaev';
	    NouvelleNotif[0].typeNotif = 'sms';
	    NouvelleNotif[0].messageTactile = 0;
	    NouvelleNotif[0].actif = 0;

	},

	onDeviceReady: function() {
	    app.refreshDeviceList();
	},

	refreshDeviceList: function() {
	    $("#deviceList").html(''); // vide la liste
	    rfduino.discover(5, app.onDiscoverDevice, app.onError);
	    app.showConnexion();
	},

	onDiscoverDevice: function(device) {
	    var listItem = document.createElement('li'),
	        html = '<div class="ui-field-contain">' + '<b>' + device.name + '</b><br/>' +
	            'RSSI: ' + device.rssi + '&nbsp;|&nbsp;' +
	            'Advertising: ' + device.advertising + '<br/>' +
	            device.uuid + '</div>';

	    listItem.setAttribute('uuid', device.uuid);
	    listItem.innerHTML = html;
	    $("#deviceList").append(listItem).enhanceWhithin();
	    $("#deviceList").listview("refresh");
	},

	connect: function(e) {
	    var uuid = e.target.getAttribute('uuid'),
	        onConnect = function() {
	            rfduino.onData(app.onData, app.onError);
	            app.showConnecte();
	        };
	    rfduino.connect(uuid, onConnect, app.onError);
	},

	disconnect: function() {
	    rfduino.disconnect(app.showConnexion, app.onError);
	},

	showConnexion: function() {
	    $("#connexion").show();
	    $("#connecte").hide();
	},

	showConnecte: function() {
	    $("#connexion").hide();
	    $("#connecte").show();
	},

	createNotif: function() {
		addNotif = 1; //1 pour créer une nouvelle notif
		$("#nomNotif").val("Notification Perso "+nbrNotif);
       	$("#selectType").val("appels").selectmenu("refresh");
        $("#selectMessageTactile").val("messageTactile1").selectmenu("refresh");
	},

	modifyNotif: function() {
		addNotif = 2; //2 pour modifier une notif existante
	},

	listModify: function() { //Permet d'afficher les bons noms/notifs/etc dans l'écran de modification.
        var id = listitem.attr("id"); //on récupère l'id de la notif
        num = parseInt(id.substring(id.indexOf('-')+1)); //variable globale, est utilisée dans app.saveNotif.
        var nom = NouvelleNotif[num].nom;// on met le nom dans une variable nom
        var type = NouvelleNotif[num].typeNotif;
        var message = NouvelleNotif[num].messageTactile;
        $("#nomNotif").val(nom);
        $("#selectType").val(type).selectmenu("refresh");
        $("#selectMessageTactile").val(message).selectmenu("refresh");
	},

	SaveNotif: function() {
		

		if (addNotif==1) { // 1 <=> on crée une nouvelle notif
			var i = nbrNotif; //i : variable locale
	        nbrNotif++; //on incrémente nbrNotif (variable globale)
	        NouvelleNotif[i] = new Notification; //on crée une instance de l'objet Notification à la ième place de l'array NouvelleNotif
	        
	        /*On change les valeurs de l'array par celles rentrées par l'user*/
	        NouvelleNotif[i].nom = document.getElementById("nomNotif").value;
	        NouvelleNotif[i].typeNotif = document.getElementById("selectType").value;
	        NouvelleNotif[i].messageTactile =  parseInt(document.getElementById("selectMessageTactile").value);

	    var newNotif = document.createElement('li'); //ajout de la notif créée en html en bout de liste (sur les 2 listes : modifier et avancé)
	        newNotif.innerHTML =    '<div class="ui-field-contain">' +
	                                    '<label id="activerNotifNom-'+ i +'" for "activerNotif-'+ i +'">' + NouvelleNotif[i].nom + '</label>' +
	                                    '<div class="activerNotif-'+ i +'"' + 'align="right">' +
	                                      '<select name="slider-' + i + '"  id="slider-'+ i +'"' + 'data-role="slider" data-mini="true">' +
	                                      '<option value="0">Off</option>' +
	                                      '<option value="1">On</option>' +
	                                      '</select>' +
	                                    '</div>' +
	                                '</div>';

	    var newNotifModifier = document.createElement('li');
	        newNotifModifier.innerHTML =    '<a href="#EcranAvanceCreer">' + '<h3 id="nomNotifModifier-'+ i +'">' + NouvelleNotif[i].nom + '</h3>'+ '</a>' +
	                                '<a href="#" class="delete">Delete</a>'
	        $("#listeNotif").append(newNotif).enhanceWithin();   //append la nouvelle notif et applique le theme au boutton
	        $("#listeNotifModifier").append(newNotifModifier).enhanceWithin();

	        $("#listeNotif li:last-child").attr("id","notifNum-"+i); // ajoute l'id notifNum- 'i' dans le <li>
	        $("#listeNotifModifier li:last-child").attr("id","notifModNum-"+i); // ajoute l'id notifModNum- 'i' dans le <li>
	        app.bindSliders(i); //on bind le slider-i
	        $("#listeNotif").listview("refresh"); // applique le theme de la liste
	        $("#listeNotifModifier").listview("refresh");
	        app.sendData(listeMessageTactile[NouvelleNotif[i].messageTactile].messageTactile);
	        addNotif=0; // on remet à 0 pour ne pas aller dans le if(2)
		}
	 	
    	
    	$("#listeNotifModifier").unbind('tap');
    	$("#listeNotifModifier li").bind('tap',this.listModify);

    	if (addNotif==2) { // 2<=> on modifie une notif existante
            NouvelleNotif[num].nom = document.getElementById("nomNotif").value;
            NouvelleNotif[num].typeNotif = document.getElementById("selectType").value;
            NouvelleNotif[num].messageTactile = parseInt(document.getElementById("selectMessageTactile").value);
            

            $("#nomNotifModifier-"+num).html(NouvelleNotif[num].nom); //met à jour les listes avec les bons noms
            $("#activerNotifNom-"+num).html(NouvelleNotif[num].nom);
			app.sendData(listeMessageTactile[NouvelleNotif[num].messageTactile].messageTactile);
            addNotif=0;
    	}
	},

 	supprNotif: function(event) {
			listitem = listitem,
        	// These are the classnames used for the CSS transition
            dir = event.type === "swipeleft" ? "left" : "right",
            // Check if the browser supports the transform (3D) CSS transition
            transition = $.support.cssTransform3d ? dir : false;
            confirmAndDelete( listitem, transition ); 

	    function confirmAndDelete(listitem, transition) {
	        // Highlight the list item that will be removed
	        listitem.children(".ui-btn").addClass("ui-btn-active");
	        // Inject topic in confirmation popup after removing any previous injected topics
	        $("#confirm .topic").remove();
	        listitem.find( ".topic" ).clone().insertAfter( "#question" );
	        // Show the confirmation popup
	        $("#confirm").popup("open");
	        // Proceed when the user confirms
	        $("#confirm #yes").on("click", function() {
	        
	        var id = listitem.attr("id"); //on récupère l'id de la notif
	        var num = id.substring(id.indexOf('-')+1); //on récupère le numéro de la notif
	        $("#notifNum-"+num).remove(); // supprime la notif dans l'écran avancé
        
        
            // Remove with a transition
            if (transition) {
                listitem
                    // Add the class for the transition direction
                    .addClass( transition )
                    // When the transition is done...
                    .on( "webkitTransitionEnd transitionend otransitionend", function() {
                        // ...the list item will be removed
                        listitem.remove();
                        // ...the list will be refreshed and the temporary class for border styling removed
                        $("#listeNotifModifier").listview( "refresh" ).find(".border-bottom").removeClass("border-bottom");
                    })
                    // During the transition the previous button gets bottom border
                    .prev("li").children("a").addClass("border-bottom")
                    // Remove the highlight
                    .end().end().children(".ui-btn").removeClass("ui-btn-active");
            }
            // If it's not a touch device or the CSS transition isn't supported just remove the list item and refresh the list
            else {
                listitem.remove();
                $( "#listeNotifModifier" ).listview( "refresh" );
            }
            $("#listeNotif").listview("refresh");   
	        });
	        // Remove active state and unbind when the cancel button is clicked
	        $( "#confirm #cancel" ).on( "touch", function() {
	            listitem.removeClass( "ui-btn-active" );
	            $( "#confirm #yes" ).off();
	        });
	    }
	},

	onError: function(reason) {
	    alert(reason);
	},

	messageTactile: function(){
		app.progressBar();

		varTimeout = setTimeout(app.messageTactileEnd, dureeMsg);
		var start = +new Date();
		msgeTact1 = [];
		msgeTact2 = [];

		$$("#act1").bind("touchstart",function(){
			msgeTact1.push(+new Date() - start);
			$$("#act1").style('background-color', '#B8B8B8');
			rfduino.write('a1');
        });
        $$("#act1").bind("touchend",function(){
        	msgeTact1.push(+new Date() - start);
        	$$("#act1").style('background-color', '#DADADA');
        	rfduino.write('a0');
        });
        $$("#act2").bind("touchstart",function(){
        	msgeTact2.push(+new Date() - start);
        	$$("#act2").style('background-color', '#B8B8B8');
        	rfduino.write('b1');
        });
        $$("#act2").bind("touchend",function(){
        	msgeTact2.push(+new Date() - start);
        	$$("#act2").style('background-color', '#DADADA');
        	rfduino.write('b0');
        });
	},

	messageTactileEnd: function() {
		$$("#act1").unbind();
        $$("#act2").unbind();
        $$("#act1").style('background-color', '#DADADA');
        $$("#act2").style('background-color', '#DADADA');

        //Les deux if servent à prévenir l'absence du dernier touchend.
       	if (msgeTact1.length!=0 && !(parseFloat(msgeTact1.length) && (msgeTact1.length %2 == 0)))
       		msgeTact1.push(dureeMsg);
      	if (msgeTact2.length!=0 && !(parseFloat(msgeTact2.length) && (msgeTact2.length %2 == 0)))
       		msgeTact2.push(dureeMsg);

      	msgeTact=[];
        msgeTact.push(msgeTact1);
        msgeTact.push(msgeTact2);
        console.log(msgeTact);
      	//app.sendData(msgeTact);
      	
    },

	progressBar: function() {
		line.set(0);
	  	line.animate(1);
	},

	SaveMessageTactile: function() {
		if (msgeTact.length==0){
			alert("Vous devez composer un message");
			$("#popupMessageTactile").popup("close");
		}
		else {
			var i = listeMessageTactile.length;
			listeMessageTactile[i] = new MsTact;
			listeMessageTactile[i].nom = document.getElementById("messageTactileNom").value;
			listeMessageTactile[i].messageTactile = msgeTact;
			$("#popupMessageTactile").popup("close");

			messLi = document.createElement('option');
			messLi.setAttribute('value', i);	
			messLi.innerHTML =  listeMessageTactile[i].nom;
			$("#selectMessageTactile").append(messLi);
		};
	},

	sendData: function(array) { 
		for (var i=0; i <2; i++) {
			sendDataInd(array,i)
		};

		function sendDataInd(array, ind) {
			var h = (i==1) ? 'b' : 'a';
			var bit=1;
			for (var j=0; j<array[ind].length; j++){
				setTimeout(function(){if (typeof rfduino!=='undefined')rfduino.write(h+bit);console.log(h+bit); bit=bit^1;}, array[ind][j]);
			};
		};
	}
};

