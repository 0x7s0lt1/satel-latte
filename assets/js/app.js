L.mapbox.accessToken = 'pk.eyJ1Ijoia3VsaW9uZXIiLCJhIjoiY2tuNTB1YXhnMDg3dDJ1cDh0aHRmNmc5diJ9.0D_Jj39P9DYUQ0oP2kyFOg';

App = {

    geo_cords : {},
    current_sat : null,
    is_menu_open : true,
    is_starting : true,
    is_draw_starting : true,
    is_tracking : false,
    km_show_interval : null,
    socket : io('https://tletolatlng.herokuapp.com/'), //io('localhost:5000'),io('https://tletolatlng.herokuapp.com/')
    loading : document.getElementById('loading'),
    cords_holder : document.getElementById('cord_tart'),
    buttons : document.querySelector('.btns'),
    menu : document.querySelector('.menu'),
    satellite_select : document.getElementById('sat_select'),
    custom_tle : document.getElementById('custom_tle'),
    wiki_modal : new bootstrap.Modal(document.getElementById('modal')),
    wiki_modal_body : document.getElementById('wiki_modal'),
    wiki_title : document.getElementById('wiki_title'),
    cords_display : document.getElementById('cord'),
    km_display :  document.getElementById('km'),
    viewer_state : 'flat',
    viewers : {
        flat : document.getElementById('map'),
        globe : document.getElementById('three_map')

    },
    tooltipTriggerList : [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]')),
    

    map : L.map('map',{
            center : [30.313445, 3.212532],
            zoom : 3,
            minZoom: 2,
            maxBounds : [[85, -180],[-85, 180]]
            })
            .addLayer(L.mapbox.styleLayer('mapbox://styles/kulioner/ckyx4j4u8006d15ldk73bk5gl',{
                continuousWorld : true,  
            })),
    sat_popup : L.popup([],{
        closeButton: false,
        }),
    sat_icon : L.icon({
        iconUrl: '#',
        iconSize: [50, 50],
        iconAnchor: [22, 94],
        popupAnchor: [-3, -76],
    }),
    sat_marker : L.marker([0,0],{
        alt : 'Satellite Marker',
        opacity: 0
    }),
    sat_user_line : L.polyline([],{color:'blue'}),
    sat_track_lines : {
        previous : L.polyline([],{color:'orange'}),
        current : L.polyline([],{color:'red'}),
        next : L.polyline([],{color:'green'})
    },
    user_field_of_view_line : L.circle([], 48280.3,{color : 'white',title:'Field of view'}),
   

    init : ()=>{

        App.resize();

        window.sat_is_changed = false;
        window.current_sat = null;

        for(let i in window.tles){
            if(i !=  'UNKNOWN'){
                App.satellite_select.innerHTML += "<option value='"+i+"'>"+ window.tles[i].has3D +" &nbsp;"+i.toUpperCase()+"</option>";

            }
        }

        /*
        App.tooltipList = App.tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl,{
                boundary: document.body
            })
            });
        */

        
        App.sat_marker.setIcon(App.sat_icon);
        App.sat_marker.bindPopup(App.sat_popup);
        App.sat_marker.addTo(App.map);

        App.sat_marker.addEventListener('mouseover',()=>{
            App.sat_marker.openPopup();
        });
        App.sat_marker.addEventListener('mouseout',()=>{
            App.sat_marker.closePopup();
        });


        App.socket.on('send',App.renderMapData);
        App.socket.on('tleError',App.tleErrorHandler);
        App.socket.on('sendTrack',App.renderSatelliteTrack);
        window.addEventListener('resize',App.resize,false);
        App.satellite_select.addEventListener('change',App.changeSatellite,false);
        App.custom_tle.addEventListener('keydown',App.getCustomSatellite,false);
        document.getElementById('get_pos').addEventListener('click',App.getPosition,false);
        document.getElementById('info').addEventListener('click',App.getWiki,false);
    },


    toggleMenu : ()=>{

        switch(App.is_menu_open){
            case true:
            App.menu.style.transform = 'translate(-100%)';
            App.is_menu_open = false;
                break;
            case false:
            App.menu.style.transform = 'translate(0%)';
            App.is_menu_open = true;
                break
        }
    },

    resize : ()=>{
        App.loading.style.width = window.innerWidth + 'px';
        App.loading.style.height = window.innerHeight + 'px';
        App.viewers.flat.style.width = (window.innerWidth + 30) + "px";
        App.viewers.flat.style.height = (window.innerHeight + 30) + "px";
        App.map.invalidateSize();
    },
    changeViewer : (state)=>{

        switch(state){
            case 'flat':
                App.viewers.globe.style.display = 'none';
                App.viewers.flat.style.display = 'block';
                App.viewer_state = 'flat';
                break;
            case 'globe':
                App.viewers.flat.style.display = 'none';
                App.viewers.globe.style.display = 'block';
                App.viewer_state = 'globe';
                break;
        }
        App.resize();

    },

    centralizeMap : ()=>{
        App.map.setView(App.geo_cords.sat,9);
    },
    toggleTracking2D : ()=>{

        if(App.is_tracking){
            App.is_tracking = false;
            document.querySelector('.fa-crosshairs').classList.remove('tracking');
            document.querySelector('.fa-crosshairs').title = 'Tracking is OFF!';
        }else{
            App.is_tracking = true;
            document.querySelector('.fa-crosshairs').classList.add('tracking');
            document.querySelector('.fa-crosshairs').title = 'Tracking is ON!';
        }

    },
    changeSatellite : (tle = null)=>{

        if(App.satellite_select.value != null){

            App.wiki_modal.hide();
            App.loading.style.display = 'block';
            App.is_starting = true;
            document.getElementById('info').classList.remove('disabled');
            App.socket.emit('get',window.tles[App.satellite_select.value].tle);
            window.current_sat = App.satellite_select.value;

        }
        else{
            App.buttons.style.display = 'none';
            App.cords_holder.style.display = 'none';
        }
        if(App.geo_cords.user != undefined){
            App.removeLine();
        }
    },
    getCustomSatellite : (e)=>{

        if(e.keyCode == 13){

            let tle = App.custom_tle.value.trim();
        
            if(tle != "" && tle != null){
                
                App.wiki_modal.hide();
                App.loading.style.display = 'block';
                App.is_starting = true;
                document.getElementById('info').classList.add('disabled');
    
                App.socket.emit('get',tle);
                window.current_sat = 'UNKNOWN';
                
            }
    
        }
        
    },
    getWiki : ()=>{

        

        if(window.current_sat != 'UNKNOWN'){

            App.loading.style.display = 'block';
            $.ajax({
                type: "GET",
                url: "https://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text&section=0&page="+window.tles[window.current_sat].wiki+"&callback=?",
                contentType: "application/json; charset=utf-8",
                async: false,
                dataType: "json",
                success: function (data) {
        
                    var markup = data.parse.text["*"];
                    App.wiki_title.innerHTML = "<a target='_blank' href='https://en.wikipedia.org/wiki/"+window.tles[window.current_sat].wiki+"' >"+window.current_sat.toUpperCase()+"</a>";
                    App.wiki_modal_body.innerHTML = markup;
                    App.wiki_modal.show();
                    App.loading.style.display = 'none';
    
                },
                error: function (err) {
                    //console.log(err);
                    App.loading.style.display = 'none';
                }
            });

        }else{
            App.oneError('Sorry!','<h3>We can only prived more information about built-in satellites.</h3>')
        }
        

        

    /*
       App.xhttp.onreadystatechange = () =>{
           if(this.readyState == 4 && this.state == 200){
               console.log(this.responseText);
           }
       }

        App.xhttp.open('GET',"https://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text&section=0&page="+window.tles[window.current_sat].wiki+"&callback=?",true);
        App.xhttp.setRequestHeader("Api-User-Agent", "DotSatellitViewer/1.0 (https:dotlab.hu/satellites)");
        App.xhttp.setRequestHeader("Content-type", "application/json; charset=utf-8");
        App.xhttp.setRequestHeader("Accept-Encoding", "gzip");
        App.xhttp.setRequestHeader("Access-Control-Allow-Origin", "*");
        App.xhttp.send();

        */
        

    },
    renderMapData : (data)=>{

        App.geo_cords.sat = [
            data.cords.lat,
            data.cords.lng
        ];

        window.sat_cords = {
            lat : data.cords.lat,
            lng : data.cords.lng
        }

        if(App.is_starting){

            window.sat_is_changed = true;

            App.sat_icon = L.icon({
                iconUrl : './assets/images/satellites/'+window.current_sat+".png",
                iconSize : [100,100]
            });

            
            App.sat_marker.setIcon(App.sat_icon);
            App.sat_marker.setLatLng(App.geo_cords.sat);
            App.sat_marker.setOpacity(1);
            App.sat_marker.update();

            App.sat_popup.setContent("<h1 class='mapPopup'>"+window.current_sat.toUpperCase()+"</h1>");

            App.cords_display.innerHTML = "Lat: "+ App.geo_cords.sat[1].toFixed(10) +" | Lng: "+App.geo_cords.sat[0].toFixed(10);
        
                    App.map.on('mouseenter','satellite',(e)=>{
                        let cords = e.features[0].geometry.coordinates.slice();
                        let desc = e.features[0].properties.description;
    
                        App.map_popup.setLngLat(cords).setHTML(desc).addTo(App.map);
                    });
                    App.map.on('mouseleave','satellite',(e)=>{
                        App.map_popup.remove();
                    });
    
                    
                    App.map.setView(App.geo_cords.sat,6)
    
                    App.is_starting = false;
                    App.buttons.style.display = 'block';
                    App.cords_holder.style.display = 'block';
                    App.loading.style.display = 'none';
                    
        
        
        }else{

            App.sat_marker.setLatLng(App.geo_cords.sat);
            App.sat_marker.update();
            App.cords_display.innerHTML = "Lat: "+ App.geo_cords.sat[1].toFixed(10) +" | Lng: "+App.geo_cords.sat[0].toFixed(10); 

            if(App.is_tracking){
                App.map.setView(App.geo_cords.sat);
            }
        
        }

    },
    getPosition : ()=>{
        App.km_display.innerHTML = "Calculating...";
        App.km_display.style.display = 'block';
        try{
            if(navigator.geolocation){

            navigator.geolocation.getCurrentPosition(pos=>{
            
                App.geo_cords.user = [ pos.coords.latitude, pos.coords.longitude ];
                App.km_show_interval = setInterval(App.drawLine,1000);
                document.getElementById('get_pos').removeEventListener('click',App.getPosition);
                document.getElementById('get_pos').addEventListener('click',App.removeLine);

            },()=>{
                App.km_display.innerHTML = "";
                alert('For this future, turn on the GPS and enable GEOLOCATION!');
            })  
        }else{
            alert('Your device not support Geolocation features!:(')
        }
        }catch(err){
            App.km_display.innerHTML = "";
            if(err) throw err;
            
        }

    },
    drawLine : ()=>{

        
        if(App.is_draw_starting){

            App.sat_user_line.setLatLngs([App.geo_cords.user,App.geo_cords.sat]).addTo(App.map);
            App.is_draw_starting = false;

            App.user_field_of_view_line.setLatLng(App.geo_cords.user).addTo(App.map);

        }else{

            App.sat_user_line.setLatLngs([App.geo_cords.user,App.geo_cords.sat]);
            App.km_display.innerHTML = turf.length(App.sat_user_line.toGeoJSON()).toLocaleString() + ' km';
            
        }

    },
    removeLine : ()=>{

        App.km_display.innerHTML = "";
        App.sat_user_line.remove();
        App.user_field_of_view_line.remove();
        clearInterval(App.km_show_interval);
        document.getElementById('get_pos').removeEventListener('click',App.removeLine);
        document.getElementById('get_pos').addEventListener('click',App.getPosition);
        App.km_display.style.display ='none';
        App.is_draw_starting = true;

    },
    renderSatelliteTrack : (data)=>{

        data.forEach(e=>{
            e.pop();
        });

        window.sat_orbits = data;

        try{

        App.sat_track_lines.previous.setLatLngs(data[0]).addTo(App.map);
        App.sat_track_lines.current.setLatLngs(data[1]).addTo(App.map);
        App.sat_track_lines.next.setLatLngs(data[2]).addTo(App.map);

        }catch(err){
            App.clearScreen();
            App.oneError('Orbit Error','<h3>An error occurred while processing the orbit data.</h3>');
        }
        
        

    },
    clearScreen : ()=>{

        App.loading.style.display = 'none';
        App.km_display.style.display ='none';
        App.buttons.style.display = 'none';
        App.cords_holder.style.display = 'none';
        App.is_starting = true;
        Object.keys(App.sat_track_lines).forEach(e=>App.sat_track_lines[e].remove());

    },
    oneError : (title,message)=>{

        App.wiki_title.innerHTML = title
        App.wiki_modal_body.innerHTML = message;
        App.wiki_modal.show();

    },
    tleErrorHandler : (err)=>{

        console.log('ServerSide:',err);
        App.sat_marker.setOpacity(0);
        App.sat_marker.update();
        App.clearScreen();
        App.oneError('TLE Error!',`<h3>An error occurred while processing the TLE.</h3>`);
        
    }
    


}

window.addEventListener('DOMContentLoaded',App.init,false);