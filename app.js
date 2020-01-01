'use strict';

$('textarea').hide();

let id = $('#trailer').data('id');
console.log("ID", id);

$.get(`http://api.themoviedb.org/3/movie/${id}/videos?api_key=57a6b853590432570e83f7520825c046`).then(data=>{
    $("#trailer").attr('src',`https://www.youtube.com/embed/${data.results[0].key}`);
});

let pageId=$('page').data('id');
console.log('pageId : ', pageId);