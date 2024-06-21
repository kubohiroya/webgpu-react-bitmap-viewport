import*as Q from"react";import q,{forwardRef as pt,useContext as Fn,useLayoutEffect as Zt,useState as zn,useRef as H,useImperativeHandle as Jt,useEffect as Ln}from"react";import Pn from"react-dom";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))r(i);new MutationObserver(i=>{for(const u of i)if(u.type==="childList")for(const s of u.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&r(s)}).observe(document,{childList:!0,subtree:!0});function n(i){const u={};return i.integrity&&(u.integrity=i.integrity),i.referrerPolicy&&(u.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?u.credentials="include":i.crossOrigin==="anonymous"?u.credentials="omit":u.credentials="same-origin",u}function r(i){if(i.ep)return;i.ep=!0;const u=n(i);fetch(i.href,u)}})();var Qt={exports:{}},Ne={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var An=q,Un=Symbol.for("react.element"),Nn=Symbol.for("react.fragment"),Vn=Object.prototype.hasOwnProperty,Dn=An.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,Mn={key:!0,ref:!0,__self:!0,__source:!0};function en(e,t,n){var r,i={},u=null,s=null;n!==void 0&&(u=""+n),t.key!==void 0&&(u=""+t.key),t.ref!==void 0&&(s=t.ref);for(r in t)Vn.call(t,r)&&!Mn.hasOwnProperty(r)&&(i[r]=t[r]);if(e&&e.defaultProps)for(r in t=e.defaultProps,t)i[r]===void 0&&(i[r]=t[r]);return{$$typeof:Un,type:e,key:u,ref:s,props:i,_owner:Dn.current}}Ne.Fragment=Nn;Ne.jsx=en;Ne.jsxs=en;Qt.exports=Ne;var Re=Qt.exports;function $n(e){if(e.sheet)return e.sheet;for(var t=0;t<document.styleSheets.length;t++)if(document.styleSheets[t].ownerNode===e)return document.styleSheets[t]}function kn(e){var t=document.createElement("style");return t.setAttribute("data-emotion",e.key),e.nonce!==void 0&&t.setAttribute("nonce",e.nonce),t.appendChild(document.createTextNode("")),t.setAttribute("data-s",""),t}var Gn=function(){function e(n){var r=this;this._insertTag=function(i){var u;r.tags.length===0?r.insertionPoint?u=r.insertionPoint.nextSibling:r.prepend?u=r.container.firstChild:u=r.before:u=r.tags[r.tags.length-1].nextSibling,r.container.insertBefore(i,u),r.tags.push(i)},this.isSpeedy=n.speedy===void 0?!0:n.speedy,this.tags=[],this.ctr=0,this.nonce=n.nonce,this.key=n.key,this.container=n.container,this.prepend=n.prepend,this.insertionPoint=n.insertionPoint,this.before=null}var t=e.prototype;return t.hydrate=function(r){r.forEach(this._insertTag)},t.insert=function(r){this.ctr%(this.isSpeedy?65e3:1)===0&&this._insertTag(kn(this));var i=this.tags[this.tags.length-1];if(this.isSpeedy){var u=$n(i);try{u.insertRule(r,u.cssRules.length)}catch{}}else i.appendChild(document.createTextNode(r));this.ctr++},t.flush=function(){this.tags.forEach(function(r){return r.parentNode&&r.parentNode.removeChild(r)}),this.tags=[],this.ctr=0},e}(),L="-ms-",Ue="-moz-",R="-webkit-",tn="comm",mt="rule",xt="decl",Yn="@import",nn="@keyframes",Hn="@layer",Xn=Math.abs,Ve=String.fromCharCode,Wn=Object.assign;function jn(e,t){return z(e,0)^45?(((t<<2^z(e,0))<<2^z(e,1))<<2^z(e,2))<<2^z(e,3):0}function rn(e){return e.trim()}function qn(e,t){return(e=t.exec(e))?e[0]:e}function w(e,t,n){return e.replace(t,n)}function lt(e,t){return e.indexOf(t)}function z(e,t){return e.charCodeAt(t)|0}function we(e,t,n){return e.slice(t,n)}function K(e){return e.length}function gt(e){return e.length}function Oe(e,t){return t.push(e),e}function Kn(e,t){return e.map(t).join("")}var De=1,pe=1,on=0,U=0,O=0,xe="";function Me(e,t,n,r,i,u,s){return{value:e,root:t,parent:n,type:r,props:i,children:u,line:De,column:pe,length:s,return:""}}function Se(e,t){return Wn(Me("",null,null,"",null,null,0),e,{length:-e.length},t)}function Zn(){return O}function Jn(){return O=U>0?z(xe,--U):0,pe--,O===10&&(pe=1,De--),O}function D(){return O=U<on?z(xe,U++):0,pe++,O===10&&(pe=1,De++),O}function J(){return z(xe,U)}function Fe(){return U}function Be(e,t){return we(xe,e,t)}function Ie(e){switch(e){case 0:case 9:case 10:case 13:case 32:return 5;case 33:case 43:case 44:case 47:case 62:case 64:case 126:case 59:case 123:case 125:return 4;case 58:return 3;case 34:case 39:case 40:case 91:return 2;case 41:case 93:return 1}return 0}function cn(e){return De=pe=1,on=K(xe=e),U=0,[]}function un(e){return xe="",e}function ze(e){return rn(Be(U-1,ft(e===91?e+2:e===40?e+1:e)))}function Qn(e){for(;(O=J())&&O<33;)D();return Ie(e)>2||Ie(O)>3?"":" "}function er(e,t){for(;--t&&D()&&!(O<48||O>102||O>57&&O<65||O>70&&O<97););return Be(e,Fe()+(t<6&&J()==32&&D()==32))}function ft(e){for(;D();)switch(O){case e:return U;case 34:case 39:e!==34&&e!==39&&ft(O);break;case 40:e===41&&ft(e);break;case 92:D();break}return U}function tr(e,t){for(;D()&&e+O!==57;)if(e+O===84&&J()===47)break;return"/*"+Be(t,U-1)+"*"+Ve(e===47?e:D())}function nr(e){for(;!Ie(J());)D();return Be(e,U)}function rr(e){return un(Le("",null,null,null,[""],e=cn(e),0,[0],e))}function Le(e,t,n,r,i,u,s,c,h){for(var m=0,g=0,o=s,S=0,P=0,d=0,v=1,T=1,p=1,B=0,$="",ce=i,k=u,N=r,E=$;T;)switch(d=B,B=D()){case 40:if(d!=108&&z(E,o-1)==58){lt(E+=w(ze(B),"&","&\f"),"&\f")!=-1&&(p=-1);break}case 34:case 39:case 91:E+=ze(B);break;case 9:case 10:case 13:case 32:E+=Qn(d);break;case 92:E+=er(Fe()-1,7);continue;case 47:switch(J()){case 42:case 47:Oe(ir(tr(D(),Fe()),t,n),h);break;default:E+="/"}break;case 123*v:c[m++]=K(E)*p;case 125*v:case 59:case 0:switch(B){case 0:case 125:T=0;case 59+g:p==-1&&(E=w(E,/\f/g,"")),P>0&&K(E)-o&&Oe(P>32?Ut(E+";",r,n,o-1):Ut(w(E," ","")+";",r,n,o-2),h);break;case 59:E+=";";default:if(Oe(N=At(E,t,n,m,g,i,c,$,ce=[],k=[],o),u),B===123)if(g===0)Le(E,t,N,N,ce,u,o,c,k);else switch(S===99&&z(E,3)===110?100:S){case 100:case 108:case 109:case 115:Le(e,N,N,r&&Oe(At(e,N,N,0,0,i,c,$,i,ce=[],o),k),i,k,o,c,r?ce:k);break;default:Le(E,N,N,N,[""],k,0,c,k)}}m=g=P=0,v=p=1,$=E="",o=s;break;case 58:o=1+K(E),P=d;default:if(v<1){if(B==123)--v;else if(B==125&&v++==0&&Jn()==125)continue}switch(E+=Ve(B),B*v){case 38:p=g>0?1:(E+="\f",-1);break;case 44:c[m++]=(K(E)-1)*p,p=1;break;case 64:J()===45&&(E+=ze(D())),S=J(),g=o=K($=E+=nr(Fe())),B++;break;case 45:d===45&&K(E)==2&&(v=0)}}return u}function At(e,t,n,r,i,u,s,c,h,m,g){for(var o=i-1,S=i===0?u:[""],P=gt(S),d=0,v=0,T=0;d<r;++d)for(var p=0,B=we(e,o+1,o=Xn(v=s[d])),$=e;p<P;++p)($=rn(v>0?S[p]+" "+B:w(B,/&\f/g,S[p])))&&(h[T++]=$);return Me(e,t,n,i===0?mt:c,h,m,g)}function ir(e,t,n){return Me(e,t,n,tn,Ve(Zn()),we(e,2,-2),0)}function Ut(e,t,n,r){return Me(e,t,n,xt,we(e,0,r),we(e,r+1,-1),r)}function ve(e,t){for(var n="",r=gt(e),i=0;i<r;i++)n+=t(e[i],i,e,t)||"";return n}function or(e,t,n,r){switch(e.type){case Hn:if(e.children.length)break;case Yn:case xt:return e.return=e.return||e.value;case tn:return"";case nn:return e.return=e.value+"{"+ve(e.children,r)+"}";case mt:e.value=e.props.join(",")}return K(n=ve(e.children,r))?e.return=e.value+"{"+n+"}":""}function cr(e){var t=gt(e);return function(n,r,i,u){for(var s="",c=0;c<t;c++)s+=e[c](n,r,i,u)||"";return s}}function ur(e){return function(t){t.root||(t=t.return)&&e(t)}}function sr(e){var t=Object.create(null);return function(n){return t[n]===void 0&&(t[n]=e(n)),t[n]}}var ar=function(t,n,r){for(var i=0,u=0;i=u,u=J(),i===38&&u===12&&(n[r]=1),!Ie(u);)D();return Be(t,U)},lr=function(t,n){var r=-1,i=44;do switch(Ie(i)){case 0:i===38&&J()===12&&(n[r]=1),t[r]+=ar(U-1,n,r);break;case 2:t[r]+=ze(i);break;case 4:if(i===44){t[++r]=J()===58?"&\f":"",n[r]=t[r].length;break}default:t[r]+=Ve(i)}while(i=D());return t},fr=function(t,n){return un(lr(cn(t),n))},Nt=new WeakMap,dr=function(t){if(!(t.type!=="rule"||!t.parent||t.length<1)){for(var n=t.value,r=t.parent,i=t.column===r.column&&t.line===r.line;r.type!=="rule";)if(r=r.parent,!r)return;if(!(t.props.length===1&&n.charCodeAt(0)!==58&&!Nt.get(r))&&!i){Nt.set(t,!0);for(var u=[],s=fr(n,u),c=r.props,h=0,m=0;h<s.length;h++)for(var g=0;g<c.length;g++,m++)t.props[m]=u[h]?s[h].replace(/&\f/g,c[g]):c[g]+" "+s[h]}}},hr=function(t){if(t.type==="decl"){var n=t.value;n.charCodeAt(0)===108&&n.charCodeAt(2)===98&&(t.return="",t.value="")}};function sn(e,t){switch(jn(e,t)){case 5103:return R+"print-"+e+e;case 5737:case 4201:case 3177:case 3433:case 1641:case 4457:case 2921:case 5572:case 6356:case 5844:case 3191:case 6645:case 3005:case 6391:case 5879:case 5623:case 6135:case 4599:case 4855:case 4215:case 6389:case 5109:case 5365:case 5621:case 3829:return R+e+e;case 5349:case 4246:case 4810:case 6968:case 2756:return R+e+Ue+e+L+e+e;case 6828:case 4268:return R+e+L+e+e;case 6165:return R+e+L+"flex-"+e+e;case 5187:return R+e+w(e,/(\w+).+(:[^]+)/,R+"box-$1$2"+L+"flex-$1$2")+e;case 5443:return R+e+L+"flex-item-"+w(e,/flex-|-self/,"")+e;case 4675:return R+e+L+"flex-line-pack"+w(e,/align-content|flex-|-self/,"")+e;case 5548:return R+e+L+w(e,"shrink","negative")+e;case 5292:return R+e+L+w(e,"basis","preferred-size")+e;case 6060:return R+"box-"+w(e,"-grow","")+R+e+L+w(e,"grow","positive")+e;case 4554:return R+w(e,/([^-])(transform)/g,"$1"+R+"$2")+e;case 6187:return w(w(w(e,/(zoom-|grab)/,R+"$1"),/(image-set)/,R+"$1"),e,"")+e;case 5495:case 3959:return w(e,/(image-set\([^]*)/,R+"$1$`$1");case 4968:return w(w(e,/(.+:)(flex-)?(.*)/,R+"box-pack:$3"+L+"flex-pack:$3"),/s.+-b[^;]+/,"justify")+R+e+e;case 4095:case 3583:case 4068:case 2532:return w(e,/(.+)-inline(.+)/,R+"$1$2")+e;case 8116:case 7059:case 5753:case 5535:case 5445:case 5701:case 4933:case 4677:case 5533:case 5789:case 5021:case 4765:if(K(e)-1-t>6)switch(z(e,t+1)){case 109:if(z(e,t+4)!==45)break;case 102:return w(e,/(.+:)(.+)-([^]+)/,"$1"+R+"$2-$3$1"+Ue+(z(e,t+3)==108?"$3":"$2-$3"))+e;case 115:return~lt(e,"stretch")?sn(w(e,"stretch","fill-available"),t)+e:e}break;case 4949:if(z(e,t+1)!==115)break;case 6444:switch(z(e,K(e)-3-(~lt(e,"!important")&&10))){case 107:return w(e,":",":"+R)+e;case 101:return w(e,/(.+:)([^;!]+)(;|!.+)?/,"$1"+R+(z(e,14)===45?"inline-":"")+"box$3$1"+R+"$2$3$1"+L+"$2box$3")+e}break;case 5936:switch(z(e,t+11)){case 114:return R+e+L+w(e,/[svh]\w+-[tblr]{2}/,"tb")+e;case 108:return R+e+L+w(e,/[svh]\w+-[tblr]{2}/,"tb-rl")+e;case 45:return R+e+L+w(e,/[svh]\w+-[tblr]{2}/,"lr")+e}return R+e+L+e+e}return e}var vr=function(t,n,r,i){if(t.length>-1&&!t.return)switch(t.type){case xt:t.return=sn(t.value,t.length);break;case nn:return ve([Se(t,{value:w(t.value,"@","@"+R)})],i);case mt:if(t.length)return Kn(t.props,function(u){switch(qn(u,/(::plac\w+|:read-\w+)/)){case":read-only":case":read-write":return ve([Se(t,{props:[w(u,/:(read-\w+)/,":"+Ue+"$1")]})],i);case"::placeholder":return ve([Se(t,{props:[w(u,/:(plac\w+)/,":"+R+"input-$1")]}),Se(t,{props:[w(u,/:(plac\w+)/,":"+Ue+"$1")]}),Se(t,{props:[w(u,/:(plac\w+)/,L+"input-$1")]})],i)}return""})}},pr=[vr],mr=function(t){var n=t.key;if(n==="css"){var r=document.querySelectorAll("style[data-emotion]:not([data-s])");Array.prototype.forEach.call(r,function(v){var T=v.getAttribute("data-emotion");T.indexOf(" ")!==-1&&(document.head.appendChild(v),v.setAttribute("data-s",""))})}var i=t.stylisPlugins||pr,u={},s,c=[];s=t.container||document.head,Array.prototype.forEach.call(document.querySelectorAll('style[data-emotion^="'+n+' "]'),function(v){for(var T=v.getAttribute("data-emotion").split(" "),p=1;p<T.length;p++)u[T[p]]=!0;c.push(v)});var h,m=[dr,hr];{var g,o=[or,ur(function(v){g.insert(v)})],S=cr(m.concat(i,o)),P=function(T){return ve(rr(T),S)};h=function(T,p,B,$){g=B,P(T?T+"{"+p.styles+"}":p.styles),$&&(d.inserted[p.name]=!0)}}var d={key:n,sheet:new Gn({key:n,container:s,nonce:t.nonce,speedy:t.speedy,prepend:t.prepend,insertionPoint:t.insertionPoint}),nonce:t.nonce,inserted:u,registered:{},insert:h};return d.sheet.hydrate(c),d},an={exports:{}},I={};/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var F=typeof Symbol=="function"&&Symbol.for,St=F?Symbol.for("react.element"):60103,yt=F?Symbol.for("react.portal"):60106,$e=F?Symbol.for("react.fragment"):60107,ke=F?Symbol.for("react.strict_mode"):60108,Ge=F?Symbol.for("react.profiler"):60114,Ye=F?Symbol.for("react.provider"):60109,He=F?Symbol.for("react.context"):60110,Rt=F?Symbol.for("react.async_mode"):60111,Xe=F?Symbol.for("react.concurrent_mode"):60111,We=F?Symbol.for("react.forward_ref"):60112,je=F?Symbol.for("react.suspense"):60113,xr=F?Symbol.for("react.suspense_list"):60120,qe=F?Symbol.for("react.memo"):60115,Ke=F?Symbol.for("react.lazy"):60116,gr=F?Symbol.for("react.block"):60121,Sr=F?Symbol.for("react.fundamental"):60117,yr=F?Symbol.for("react.responder"):60118,Rr=F?Symbol.for("react.scope"):60119;function M(e){if(typeof e=="object"&&e!==null){var t=e.$$typeof;switch(t){case St:switch(e=e.type,e){case Rt:case Xe:case $e:case Ge:case ke:case je:return e;default:switch(e=e&&e.$$typeof,e){case He:case We:case Ke:case qe:case Ye:return e;default:return t}}case yt:return t}}}function ln(e){return M(e)===Xe}I.AsyncMode=Rt;I.ConcurrentMode=Xe;I.ContextConsumer=He;I.ContextProvider=Ye;I.Element=St;I.ForwardRef=We;I.Fragment=$e;I.Lazy=Ke;I.Memo=qe;I.Portal=yt;I.Profiler=Ge;I.StrictMode=ke;I.Suspense=je;I.isAsyncMode=function(e){return ln(e)||M(e)===Rt};I.isConcurrentMode=ln;I.isContextConsumer=function(e){return M(e)===He};I.isContextProvider=function(e){return M(e)===Ye};I.isElement=function(e){return typeof e=="object"&&e!==null&&e.$$typeof===St};I.isForwardRef=function(e){return M(e)===We};I.isFragment=function(e){return M(e)===$e};I.isLazy=function(e){return M(e)===Ke};I.isMemo=function(e){return M(e)===qe};I.isPortal=function(e){return M(e)===yt};I.isProfiler=function(e){return M(e)===Ge};I.isStrictMode=function(e){return M(e)===ke};I.isSuspense=function(e){return M(e)===je};I.isValidElementType=function(e){return typeof e=="string"||typeof e=="function"||e===$e||e===Xe||e===Ge||e===ke||e===je||e===xr||typeof e=="object"&&e!==null&&(e.$$typeof===Ke||e.$$typeof===qe||e.$$typeof===Ye||e.$$typeof===He||e.$$typeof===We||e.$$typeof===Sr||e.$$typeof===yr||e.$$typeof===Rr||e.$$typeof===gr)};I.typeOf=M;an.exports=I;var wr=an.exports,fn=wr,Ir={$$typeof:!0,render:!0,defaultProps:!0,displayName:!0,propTypes:!0},Er={$$typeof:!0,compare:!0,defaultProps:!0,displayName:!0,propTypes:!0,type:!0},dn={};dn[fn.ForwardRef]=Ir;dn[fn.Memo]=Er;var Br=!0;function br(e,t,n){var r="";return n.split(" ").forEach(function(i){e[i]!==void 0?t.push(e[i]+";"):r+=i+" "}),r}var hn=function(t,n,r){var i=t.key+"-"+n.name;(r===!1||Br===!1)&&t.registered[i]===void 0&&(t.registered[i]=n.styles)},Tr=function(t,n,r){hn(t,n,r);var i=t.key+"-"+n.name;if(t.inserted[n.name]===void 0){var u=n;do t.insert(n===u?"."+i:"",u,t.sheet,!0),u=u.next;while(u!==void 0)}};function Cr(e){for(var t=0,n,r=0,i=e.length;i>=4;++r,i-=4)n=e.charCodeAt(r)&255|(e.charCodeAt(++r)&255)<<8|(e.charCodeAt(++r)&255)<<16|(e.charCodeAt(++r)&255)<<24,n=(n&65535)*1540483477+((n>>>16)*59797<<16),n^=n>>>24,t=(n&65535)*1540483477+((n>>>16)*59797<<16)^(t&65535)*1540483477+((t>>>16)*59797<<16);switch(i){case 3:t^=(e.charCodeAt(r+2)&255)<<16;case 2:t^=(e.charCodeAt(r+1)&255)<<8;case 1:t^=e.charCodeAt(r)&255,t=(t&65535)*1540483477+((t>>>16)*59797<<16)}return t^=t>>>13,t=(t&65535)*1540483477+((t>>>16)*59797<<16),((t^t>>>15)>>>0).toString(36)}var Or={animationIterationCount:1,aspectRatio:1,borderImageOutset:1,borderImageSlice:1,borderImageWidth:1,boxFlex:1,boxFlexGroup:1,boxOrdinalGroup:1,columnCount:1,columns:1,flex:1,flexGrow:1,flexPositive:1,flexShrink:1,flexNegative:1,flexOrder:1,gridRow:1,gridRowEnd:1,gridRowSpan:1,gridRowStart:1,gridColumn:1,gridColumnEnd:1,gridColumnSpan:1,gridColumnStart:1,msGridRow:1,msGridRowSpan:1,msGridColumn:1,msGridColumnSpan:1,fontWeight:1,lineHeight:1,opacity:1,order:1,orphans:1,tabSize:1,widows:1,zIndex:1,zoom:1,WebkitLineClamp:1,fillOpacity:1,floodOpacity:1,stopOpacity:1,strokeDasharray:1,strokeDashoffset:1,strokeMiterlimit:1,strokeOpacity:1,strokeWidth:1},_r=/[A-Z]|^ms/g,Fr=/_EMO_([^_]+?)_([^]*?)_EMO_/g,vn=function(t){return t.charCodeAt(1)===45},Vt=function(t){return t!=null&&typeof t!="boolean"},it=sr(function(e){return vn(e)?e:e.replace(_r,"-$&").toLowerCase()}),Dt=function(t,n){switch(t){case"animation":case"animationName":if(typeof n=="string")return n.replace(Fr,function(r,i,u){return Z={name:i,styles:u,next:Z},i})}return Or[t]!==1&&!vn(t)&&typeof n=="number"&&n!==0?n+"px":n};function Ee(e,t,n){if(n==null)return"";if(n.__emotion_styles!==void 0)return n;switch(typeof n){case"boolean":return"";case"object":{if(n.anim===1)return Z={name:n.name,styles:n.styles,next:Z},n.name;if(n.styles!==void 0){var r=n.next;if(r!==void 0)for(;r!==void 0;)Z={name:r.name,styles:r.styles,next:Z},r=r.next;var i=n.styles+";";return i}return zr(e,t,n)}case"function":{if(e!==void 0){var u=Z,s=n(e);return Z=u,Ee(e,t,s)}break}}return n}function zr(e,t,n){var r="";if(Array.isArray(n))for(var i=0;i<n.length;i++)r+=Ee(e,t,n[i])+";";else for(var u in n){var s=n[u];if(typeof s!="object")Vt(s)&&(r+=it(u)+":"+Dt(u,s)+";");else if(Array.isArray(s)&&typeof s[0]=="string"&&t==null)for(var c=0;c<s.length;c++)Vt(s[c])&&(r+=it(u)+":"+Dt(u,s[c])+";");else{var h=Ee(e,t,s);switch(u){case"animation":case"animationName":{r+=it(u)+":"+h+";";break}default:r+=u+"{"+h+"}"}}}return r}var Mt=/label:\s*([^\s;\n{]+)\s*(;|$)/g,Z,Lr=function(t,n,r){if(t.length===1&&typeof t[0]=="object"&&t[0]!==null&&t[0].styles!==void 0)return t[0];var i=!0,u="";Z=void 0;var s=t[0];s==null||s.raw===void 0?(i=!1,u+=Ee(r,n,s)):u+=s[0];for(var c=1;c<t.length;c++)u+=Ee(r,n,t[c]),i&&(u+=s[c]);Mt.lastIndex=0;for(var h="",m;(m=Mt.exec(u))!==null;)h+="-"+m[1];var g=Cr(u)+h;return{name:g,styles:u,next:Z}},Pr=function(t){return t()},Ar=Q.useInsertionEffect?Q.useInsertionEffect:!1,Ur=Ar||Pr,Ze={}.hasOwnProperty,pn=Q.createContext(typeof HTMLElement<"u"?mr({key:"css"}):null);pn.Provider;var Nr=function(t){return pt(function(n,r){var i=Fn(pn);return t(n,i,r)})},Vr=Q.createContext({}),dt="__EMOTION_TYPE_PLEASE_DO_NOT_USE__",mn=function(t,n){var r={};for(var i in n)Ze.call(n,i)&&(r[i]=n[i]);return r[dt]=t,r},Dr=function(t){var n=t.cache,r=t.serialized,i=t.isStringTag;return hn(n,r,i),Ur(function(){return Tr(n,r,i)}),null},Mr=Nr(function(e,t,n){var r=e.css;typeof r=="string"&&t.registered[r]!==void 0&&(r=t.registered[r]);var i=e[dt],u=[r],s="";typeof e.className=="string"?s=br(t.registered,u,e.className):e.className!=null&&(s=e.className+" ");var c=Lr(u,void 0,Q.useContext(Vr));s+=t.key+"-"+c.name;var h={};for(var m in e)Ze.call(e,m)&&m!=="css"&&m!==dt&&(h[m]=e[m]);return h.ref=n,h.className=s,Q.createElement(Q.Fragment,null,Q.createElement(Dr,{cache:t,serialized:c,isStringTag:typeof i=="string"}),Q.createElement(i,h))}),xn=Mr,gn=Re.Fragment;function V(e,t,n){return Ze.call(t,"css")?Re.jsx(xn,mn(e,t),n):Re.jsx(e,t,n)}function Sn(e,t,n){return Ze.call(t,"css")?Re.jsxs(xn,mn(e,t),n):Re.jsxs(e,t,n)}var yn,$t=Pn;yn=$t.createRoot,$t.hydrateRoot;const Rn=q.createContext(null),$r=e=>{const t=q.createRef(),n={...e,canvasRef:t};return Zt(()=>{t.current&&(t.current.style.cursor="wait")},[t.current]),Sn(Rn.Provider,{value:n,children:[V("canvas",{id:e.canvasId,ref:t,width:e.canvasSize.width,height:e.canvasSize.height}),e.children]})},wn=()=>{const e=q.useContext(Rn);if(!e)throw new Error("useLayoutContext must be used within a LayoutContextProvider");return e},In=q.createContext(null),kr=e=>{const t={data:e.data,gridSize:e.gridSize};return V(In.Provider,{value:t,children:e.children})},En=()=>{const e=q.useContext(In);if(!e)throw new Error("useGridContext must be used within a GridContextProvider");return e},Bn=2,wt=4,It=4,oe=3,Gr=14,Yr=Gr*It,Hr=(e,t,n,r)=>new Float32Array([t.gridSize.numColumns,t.gridSize.numRows,e.canvasSize.width,e.canvasSize.height,e.headerOffset.left,e.headerOffset.top,n.left,n.top,n.right,n.bottom,n.right-n.left,n.bottom-n.top,r.x,r.y]),Xr=6,Wr=Xr*wt,jr=(e,t,n)=>new Uint32Array([e.gridSize.numColumns,e.gridSize.numRows,t.numColumnsToShow,t.numRowsToShow,n,0]),kt=(e,t,n)=>t.createBuffer({label:e,size:n,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),qr=(e,t,n)=>t.createBuffer({label:e,size:n,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),ot=(e,t,n)=>t.createBuffer({label:e,size:n,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),ue=(e,t,n)=>{e.queue.writeBuffer(t,0,n),t.unmap()},Kr=`const TRUE = 1u;
const FALSE = 0u;
override scrollBarRadius: f32 = 5.0;
override scrollBarMargin: f32 = 2.0;

struct VertexInput {
  @builtin(instance_index) instanceIndex: u32,
  @builtin(vertex_index) vertexIndex: u32,
  @location(0) position: vec2f,
};

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) cellValue: f32,
  @location(1) @interpolate(flat) isInfinity: u32,
  @location(2) @interpolate(flat) isFocused: u32,
  @location(3) @interpolate(flat) isSelected: u32,
  @location(4) @interpolate(flat) vertexIndex: u32,
};

struct F32uni {
  gridSize: vec2f,
  canvasSize: vec2f,
  header: vec2f,
  viewportLeftTop: vec2f,
  viewportRightBottom: vec2f,
  viewportSize: vec2f,
  overscroll: vec2f,
};
@group(0) @binding(0) var<uniform> f32uni: F32uni;

struct U32uni {
  gridSize: vec2u,
  numColumnsToShow: u32,
  numRowsToShow: u32,
  scrollBarState: u32,
};
@group(0) @binding(1) var<uniform> u32uni: U32uni;
@group(0) @binding(2) var<storage, read> focused: array<u32>;
@group(0) @binding(3) var<storage, read> selected: array<u32>;
@group(0) @binding(4) var<storage, read> gridData: array<f32>;

fn cellToWorld(cellX: u32, cellY: u32, position: vec2f) -> vec2f {
  let cell = vec2f(f32(cellX), f32(cellY));
  return floor(f32uni.viewportLeftTop) + (cell + (position * vec2f(0.5, -0.5) + 0.5) );
}

fn worldToViewport(world: vec2f) -> vec2f {
  return (world - f32uni.viewportLeftTop) / f32uni.viewportSize;
}

fn viewportToFrame(viewport: vec2f) -> vec2f {
  return (f32uni.header * viewport + f32uni.canvasSize * (1 - viewport)) / f32uni.canvasSize;
}

fn frameToCanvas(frame: vec2f) -> vec2f {
  // return frame - ( f32uni.overscroll + f32uni.header) / f32uni.canvasSize;
  return frame + ( f32uni.overscroll - f32uni.header) / f32uni.canvasSize;
}

fn canvasToDimension(canvas: vec2f) -> vec2f {
  return canvas * vec2f(-1, 1) + (1 - canvas) * vec2f(1, -1);
}

fn transform(cellX: u32, cellY: u32, position: vec2f) -> vec2f {
  let world = cellToWorld(cellX, cellY, position); // 0.0 - 1.0
  let viewport = worldToViewport(world);  // 0.0 - 1.0
  let frame = viewportToFrame(viewport); // 0.0 - 1.0
  let canvas = frameToCanvas(frame); // 0.0 - 1.0
  // let dimension = canvasToDimension(world / f32uni.gridSize); // test 1 passed
  // let dimension = canvasToDimension(viewport); // test 2 passed
  // let dimension = canvasToDimension(frame); // test 3 passed
  let dimension = canvasToDimension(canvas);
  return dimension;
}

@vertex
fn vertexBody(
    input: VertexInput
) -> VertexOutput {
    var output: VertexOutput;
    let cellX: u32 = input.instanceIndex % u32uni.numColumnsToShow;
    let cellY: u32 = input.instanceIndex / u32uni.numColumnsToShow;
    let gridX: u32 = cellX + u32(f32uni.viewportLeftTop.x);
    let gridY: u32 = cellY + u32(f32uni.viewportLeftTop.y);
    output.position = vec4f(transform(cellX, cellY, input.position), 0.0, 1.0);
    output.vertexIndex = input.vertexIndex;
    let gridIndex = gridX + gridY * u32uni.gridSize.x;
    output.cellValue = gridData[gridIndex];
    output.isInfinity = select(FALSE, TRUE, checkInfinity(output.cellValue));
    let columnFocused = checkColumnFocused(gridX);
    let rowFocused = checkRowFocused(gridY);
    output.isFocused = select(FALSE, TRUE, (!(columnFocused && rowFocused)) && (columnFocused || rowFocused));
    output.isSelected = select(FALSE, TRUE, checkSelected(gridX) || checkSelected(gridY));
    return output;
}

@vertex
fn vertexLeftHeader(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  let cellY: u32 = input.instanceIndex;
  let gridY: u32 = cellY + u32(f32uni.viewportLeftTop.y);
  let rowIndex: u32 = u32(f32uni.viewportLeftTop.y) + input.instanceIndex;
  var transformed: vec2f = transform(0, cellY, input.position);
  output.position = vec4f(transformed, 0.0, 1.0);
  // output.vertexIndex = input.vertexIndex;
  output.isFocused = select(FALSE, TRUE, checkRowFocused(rowIndex));
  output.isSelected = select(FALSE, TRUE, checkSelected(rowIndex));
  if(input.instanceIndex == 0){
    if(input.vertexIndex == 0u || input.vertexIndex == 3u || input.vertexIndex == 5u){
      output.position.x = -1.0;
    }else{
      output.position.x = -1 + 2 * f32uni.header.x / f32uni.canvasSize.x;
    }
    if(input.vertexIndex == 2u || input.vertexIndex == 4u || input.vertexIndex == 5u){
      output.position.y = 1.0;
    }
  }else{
    if(input.vertexIndex == 0u || input.vertexIndex == 3u || input.vertexIndex == 5u){
      output.position.x = -1.0;
    }else{
      output.position.x = -1 + 2 * f32uni.header.x / f32uni.canvasSize.x;
    }
  }
  return output;
}

@vertex
fn vertexTopHeader(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  let cellX: u32 = input.instanceIndex;
  let gridX: u32 = cellX + u32(f32uni.viewportLeftTop.x);
  let colIndex = u32(f32uni.viewportLeftTop.x) + input.instanceIndex;
  var transformed: vec2f = transform(cellX, 0, input.position);
  output.position = vec4f(transformed, 0.0, 1.0);
  // output.vertexIndex = input.vertexIndex;
  output.isFocused = select(FALSE, TRUE, checkColumnFocused(colIndex));
  output.isSelected = select(FALSE, TRUE, checkSelected(colIndex));
  if(input.instanceIndex == 0){
    if(input.vertexIndex == 2u || input.vertexIndex == 3u || input.vertexIndex == 4u){
      output.position.y = 1.0;
      //output.position.y = 1 - 2 * f32uni.header.y / f32uni.canvasSize.y;
    }else{
      output.position.y = 1 - 2 * f32uni.header.y / f32uni.canvasSize.y;
    }
    if(input.vertexIndex == 0u || input.vertexIndex == 3u || input.vertexIndex == 5u){
      output.position.x = -1.0;
    }
  }else{
    if(input.vertexIndex == 2u || input.vertexIndex == 3u || input.vertexIndex == 4u){
      output.position.y = 1.0;
    }else{
      output.position.y = 1 + -2 * f32uni.header.y / f32uni.canvasSize.y;
    }
  }
  return output;
}

@vertex
fn vertexColumnFocusSelect(input: VertexInput) -> VertexOutput{
  var output: VertexOutput;
  let cellX: u32 = input.instanceIndex;
  let gridX: u32 = cellX + u32(f32uni.viewportLeftTop.x);
  let colIndex = u32(f32uni.viewportLeftTop.x) + input.instanceIndex;
  var transformed: vec2f = transform(cellX, 0, input.position);
  output.position = vec4f(transformed, 0.0, 1.0);
  output.isFocused = select(FALSE, TRUE, checkColumnFocused(colIndex));
  output.isSelected = select(FALSE, TRUE, checkSelected(colIndex));

  if(input.vertexIndex == 2u || input.vertexIndex == 4u || input.vertexIndex == 5u){
    output.position.y = 1.0;
  }
  if(input.vertexIndex == 0u ||
    input.vertexIndex == 1u || input.vertexIndex == 3u){
    output.position.y = -1.0;
  }
  return output;
}

@vertex
fn vertexRowFocusSelect(input: VertexInput) -> VertexOutput{
  var output: VertexOutput;
  let cellY: u32 = input.instanceIndex;
  let gridY: u32 = cellY + u32(f32uni.viewportLeftTop.y);
  let rowIndex: u32 = u32(f32uni.viewportLeftTop.y) + input.instanceIndex;
  var transformed: vec2f = transform(0, cellY, input.position);
  output.position = vec4f(transformed, 0.0, 1.0);
  output.isFocused = select(FALSE, TRUE, checkRowFocused(rowIndex));
  output.isSelected = select(FALSE, TRUE, checkSelected(rowIndex));
  if(input.vertexIndex == 1u || input.vertexIndex == 2u || input.vertexIndex == 4u){
      output.position.x = 1.0;
    }
    if(input.vertexIndex == 0u ||
    input.vertexIndex == 3u || input.vertexIndex == 5u){
    output.position.x = -1.0;
  }
  return output;
}

fn rectangleVertexPosition(vertexIndex: u32, left: f32, top: f32, right: f32, bottom: f32) -> vec4f {
  switch(vertexIndex % 6){
    case 0, 3: {
      return vec4f(left, bottom , 0, 1);
    }
    case 1: {
      return vec4f(right, bottom, 0, 1);
    }
    case 2, 4: {
      return vec4f(right, top, 0, 1);
    }
    case 5: {
      return vec4f(left, top, 0, 1);
    }
    default: {
      return vec4f(0, 0, 0, 1);
    }
  }
}

@vertex
fn vertexScrollBarBackground(input: VertexInput) -> VertexOutput{
  var output: VertexOutput;
  if(input.instanceIndex == 0){ // horizontal(bottom)
    let left = -1.0 + 2 * f32uni.header.x / f32uni.canvasSize.x;
    let right = 1.0;
    let top = -1.0 + 2 * (scrollBarRadius * 2 + scrollBarMargin) / f32uni.canvasSize.y;
    let bottom = -1.0 + 2 * scrollBarMargin / f32uni.canvasSize.y;
    output.position = rectangleVertexPosition(input.vertexIndex, left, top, right, bottom);
    output.isFocused = select(FALSE, TRUE, u32uni.scrollBarState == 1u || u32uni.scrollBarState == 3u);
  }else{ //vertical
    let left = 1.0 - 2 * (scrollBarRadius * 2 + scrollBarMargin) / f32uni.canvasSize.y;
    let top = 1.0 - 2 * f32uni.header.y / f32uni.canvasSize.y;
    let right = 1.0 - 2 * scrollBarMargin / f32uni.canvasSize.x;
    let bottom = -1.0;
    output.position = rectangleVertexPosition(input.vertexIndex, left, top, right, bottom);
    output.isFocused = select(FALSE, TRUE, u32uni.scrollBarState == 2u || u32uni.scrollBarState == 3u);
  }
  return output;
}

@vertex
fn vertexScrollBarBody(input: VertexInput) -> VertexOutput{
  var output: VertexOutput;
  output.position = vec4f(input.position, 0.0, 1.0);
  const baseIndex = 12;
  const NUM_VERTICES_PER_POLYGON = 3;
  if(input.instanceIndex == 0){ // horizontal scrollbar
    output.isFocused = select(FALSE, TRUE, u32uni.scrollBarState == 1u || u32uni.scrollBarState == 3u);
    let left: f32 = -1 +
      2 * ((f32uni.header.x - f32uni.overscroll.x + scrollBarRadius) / f32uni.canvasSize.x +
                            f32uni.viewportLeftTop.x *
                            (f32uni.canvasSize.x - f32uni.header.x - scrollBarRadius * 2) /
                             f32uni.canvasSize.x / f32uni.gridSize.x);
    let right: f32 = -1 +
      2 * ((f32uni.header.x - f32uni.overscroll.x + scrollBarRadius) / f32uni.canvasSize.x +
                            f32uni.viewportRightBottom.x *
                            (f32uni.canvasSize.x - f32uni.header.x - scrollBarRadius * 2) /
                             f32uni.canvasSize.x / f32uni.gridSize.x);
    if(6 <= input.vertexIndex && input.vertexIndex < baseIndex){
      let top: f32 = -1 + 2 * (f32uni.overscroll.y + scrollBarMargin) / f32uni.canvasSize.y;
      let bottom: f32 = -1 + 2 * (f32uni.overscroll.y + scrollBarMargin + scrollBarRadius * 2) / f32uni.canvasSize.y;
      output.position = rectangleVertexPosition(input.vertexIndex - 6, left, top, right, bottom);
      return output;
    } else if(input.vertexIndex - baseIndex < 24 * 3){
      let horizontalLineCenter: f32 = -1 + 2 * (f32uni.overscroll.y + scrollBarMargin + scrollBarRadius) / f32uni.canvasSize.y;
      let radius = 2 * scrollBarRadius / f32uni.canvasSize.y;
      if(( input.vertexIndex < baseIndex + NUM_VERTICES_PER_POLYGON * 6) || (baseIndex + NUM_VERTICES_PER_POLYGON * 18 <= input.vertexIndex && input.vertexIndex < baseIndex + NUM_VERTICES_PER_POLYGON * 24)){
        let center = vec2f(right, horizontalLineCenter);
        output.position = vec4f(input.position * radius + center, 0, 1);
      }else if(baseIndex + NUM_VERTICES_PER_POLYGON * 6 <= input.vertexIndex && input.vertexIndex < baseIndex + NUM_VERTICES_PER_POLYGON * 18){
        let center = vec2f(left, horizontalLineCenter);
        output.position = vec4f(input.position * radius + center, 0, 1);
      }
      return output;
    }

  } else if(input.instanceIndex == 1){ // vertical scrollbar
    output.isFocused = select(FALSE, TRUE, u32uni.scrollBarState == 2u || u32uni.scrollBarState == 3u);
    let top: f32 = 1 - 2 * ((f32uni.header.y - f32uni.overscroll.y + scrollBarRadius) / f32uni.canvasSize.y +
                            f32uni.viewportLeftTop.y *
                            (f32uni.canvasSize.y - f32uni.header.y - scrollBarRadius * 2) /
                            f32uni.canvasSize.y / f32uni.gridSize.y);
    let bottom: f32 = 1 - 2 * ((f32uni.header.y - f32uni.overscroll.y + scrollBarRadius) / f32uni.canvasSize.y +
                            f32uni.viewportRightBottom.y *
                            (f32uni.canvasSize.y - f32uni.header.y- scrollBarRadius * 2) / f32uni.canvasSize.y / f32uni.gridSize.y);

    if(input.vertexIndex < baseIndex){
      let left:f32 = 1 - 2 * (scrollBarMargin + f32uni.overscroll.x) / f32uni.canvasSize.x;
      let right:f32 = 1 - 2 * (scrollBarMargin + f32uni.overscroll.x + scrollBarRadius * 2) / f32uni.canvasSize.x;
      output.position = rectangleVertexPosition(input.vertexIndex - 6, left, top, right, bottom);
      return output;
    } else {
      let verticalLineCenter:f32 = 1 - 2 * (scrollBarMargin + f32uni.overscroll.x + scrollBarRadius) / f32uni.canvasSize.x;
      let radius = 2 * scrollBarRadius / f32uni.canvasSize.x;
      if(baseIndex <= input.vertexIndex && input.vertexIndex < baseIndex + NUM_VERTICES_PER_POLYGON * 12){
        let center = vec2f(verticalLineCenter, top);
        output.position = vec4f(input.position * radius + center, 0, 1);
      }else if(baseIndex + NUM_VERTICES_PER_POLYGON * 12 <= input.vertexIndex && input.vertexIndex < baseIndex + NUM_VERTICES_PER_POLYGON * 24){
        let center = vec2f(verticalLineCenter, bottom);
        output.position = vec4f(input.position * radius + center, 0, 1);
      }
      return output;
    }
  }
  return output;
}

// HSVからRGBへの変換を行う関数
fn hsvToRgb(h: f32, s: f32, v: f32) -> vec3f {
    if (s == 0.0) {
        // If saturation is 0, the color is grayscale
        return vec3f(v, v, v);
    } else {
        // Normalize hue to [0, 6)
        var h_i: f32 = h * 6.0;
        var i: u32 = u32(h_i) % 6;  // Index for selecting calculation method
        var f: f32 = h_i - f32(i);  // Fractional part

        var p: f32 = v * (1.0 - s);
        var q: f32 = v * (1.0 - (s * f));
        var t: f32 = v * (1.0 - (s * (1.0 - f)));

        // Calculate and return rgb based on i value
        switch (i) {
            case 0: { return vec3f(v, t, p);}
            case 1: { return vec3f(q, v, p);}
            case 2: { return vec3f(p, v, t);}
            case 3: { return vec3f(p, q, v);}
            case 4: { return vec3f(t, p, v);}
            case 5: { return vec3f(v, p, q); }
            default: { return vec3f(0.0, 0.0, 0.0);}  // Should never reach here
        }
    }
}

fn isTrue(value: u32) -> bool {
    return value == 1u;
}

fn isFalse(value: u32) -> bool {
    return value == 0u;
}

fn checkInfinity(value: f32) -> bool {
    return value == value + 1.0 || value == value - 1.0;
}

fn checkColumnFocused(columnIndex: u32) -> bool {
    return focused[columnIndex] == 1u || focused[columnIndex] == 3u;
}
fn checkRowFocused(rowIndex: u32) -> bool {
    return focused[rowIndex] == 2u || focused[rowIndex] == 3u;
}

fn checkSelected(index: u32) -> bool {
    return selected[index] == 1u;
}

@fragment
fn fragmentBody(input: VertexOutput) -> @location(0) vec4f {
  if(isTrue(input.isInfinity)) {
    if(isTrue(input.isFocused)) {
      if(isTrue(input.isSelected)) {
        return vec4f(0.6, 0.6, 0.6, 0.9);
      } else {
        return vec4f(0.6, 0.6, 0.3, 0.9);
      }
    }else{
      if(isTrue(input.isSelected)) {
        return vec4f(0.6, 0.3, 0.6, 0.9);
      } else {
        return vec4f(0.6, 0.3, 0.3, 0.9);
      }
    }
  }else{
    if(isTrue(input.isFocused)) {
      if(isTrue(input.isSelected)) {
        let rgb = hsvToRgb(input.cellValue * 0.8, 0.5, 0.5);
        return vec4f(rgb, 0.9);
      } else {
        let rgb = hsvToRgb(input.cellValue * 0.8, 1.0, 0.5);
        return vec4f(rgb, 0.9);
      }
    } else {
      if(isTrue(input.isSelected)) {
        let rgb = hsvToRgb(input.cellValue * 0.8, 0.5, 1.0);
        return vec4f(rgb, 0.9);
      } else {
        let rgb = hsvToRgb(input.cellValue * 0.8, 1.0, 1.0);
        return vec4f(rgb, 0.9);
      }
    }
  }
}

@fragment
fn fragmentLeftHeader(input: VertexOutput) -> @location(0) vec4f {
  let focused = isTrue(input.isFocused);
  let selected = isTrue(input.isSelected);
  if(focused) {
    if(selected){
      return vec4f(0.9, 0.9, 0.0, 1);
    }else{
      return vec4f(0.7, 0.7, 0.7, 1);
    }
  }else{
    if(selected){
      return vec4f(0.8, 0.8, 0.6, 1);
    }else{
      return vec4f(0.5, 0.5, 0.5, 1);
    }
  }
}

@fragment
fn fragmentTopHeader(input: VertexOutput) -> @location(0) vec4f {
  let focused = isTrue(input.isFocused);
  let selected = isTrue(input.isSelected);
  if(focused) {
    if(selected){
      return vec4f(0.9, 0.9, 0.0, 1);
    }else{
      return vec4f(0.7, 0.7, 0.7, 1);
    }
  }else{
    if(selected){
      return vec4f(0.8, 0.8, 0.6, 1);
    }else{
      return vec4f(0.5, 0.5, 0.5, 1);
    }
  }
}

@fragment
fn fragmentColumnFocusSelect(input: VertexOutput) -> @location(0) vec4f{
  let focused = isTrue(input.isFocused);
  let selected = isTrue(input.isSelected);
  if(focused) {
    if(selected) {
      return vec4f(0.9, 0.9, 0.6, 0.5);
    }else{
      return vec4f(0.6, 0.6, 0.6, 0.5);
    }
  }else{
    if(selected) {
      return vec4f(0.9, 0.9, 0.7, 0.5);
    }else{
      return vec4f(1.0, 1.0, 1.0, 1.0);
    }
  }
}

@fragment
fn fragmentRowFocusSelect(input: VertexOutput) -> @location(0) vec4f{
  let focused = isTrue(input.isFocused);
  let selected = isTrue(input.isSelected);
  if(focused) {
    if(selected) {
      return vec4f(0.9, 0.9, 0.6, 0.5);
    }else{
      return vec4f(0.6, 0.6, 0.6, 0.5);
    }
  }else{
    if(selected) {
      return vec4f(0.9, 0.9, 0.7, 0.5);
    }else{
      return vec4f(1.0, 1.0, 1.0, 1.0);
    }
  }
}

@fragment
fn fragmentScrollBarBackground(input: VertexOutput) -> @location(0) vec4f{
  if(isTrue(input.isFocused)){
    return vec4f(0.5, 0.5, 0.5, 0.6);
  }else{
    return vec4f(0.8, 0.8, 0.8, 0.1);
  }
}

@fragment
fn fragmentScrollBarBody(input: VertexOutput) -> @location(0) vec4f{
  if(isTrue(input.isFocused)){
    return vec4f(0.1, 0.1, 0.1, 0.7);
  }else{
    return vec4f(0.3, 0.3, 0.3, 0.6);
  }
}
`,bn=[-1,-1,1,-1,1,1,-1,-1,1,1,-1,1],Zr=bn.map(e=>e*.8),ye=24,ie=new Array(ye*oe*Bn);[...Array(ye).keys()].forEach(e=>{const t=Math.PI*2/ye*e,n=Math.PI*2/ye*(e+1),r=.95;let i=e*oe*Bn;ie[i++]=0,ie[i++]=0,ie[i++]=Math.cos(n)*r,ie[i++]=Math.sin(n)*r,ie[i++]=Math.cos(t)*r,ie[i++]=Math.sin(t)*r});const Tn=[...Zr,...bn,...ie],Jr=Tn.length*It,ct=0,Qr=6,ei=6,Pe={BODY:0,TOP_HEADER:1,LEFT_HEADER:2,SCROLLBAR_BACKGROUND:3,SCROLLBAR_BODY:4},ut=0,Ae=4,Gt=[2*oe,ut,ct,0,2*oe,ut,ct,0,2*oe,ut,ct,0,2*oe,2,Qr,0,(2+ye)*oe,2,ei,0],ne=new Map(Array.from(Object.entries(Pe),([e,t])=>[e,t*Ae*wt])),st=1,ti=(e,t,n)=>{e[Pe.BODY*Ae+st]=t*n,e[Pe.TOP_HEADER*Ae+st]=t,e[Pe.LEFT_HEADER*Ae+st]=n},ni={label:"Grid bindGroupLayout",entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform"}},{binding:2,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}},{binding:3,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}},{binding:4,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}}]},ht=5,vt=2;class ri{constructor(t,n,r,i,u){var o,S;this.device=t,this.canvasFormat=n,this.canvasElementContext=i;const s=t.createShaderModule({label:"Grid shader",code:Kr}),c=t.createBindGroupLayout(ni),h=t.createPipelineLayout({label:"Grid renderer pipeline layout",bindGroupLayouts:[c]});this.canvasContext=r;const m=(P,d,v,T,p)=>{const B=i.multisample?{multisample:{count:i.multisample}}:{};return d.createRenderPipeline({label:P,layout:h,...B,vertex:{module:s,entryPoint:v,...p,buffers:[{arrayStride:8,attributes:[{format:"float32x2",offset:0,shaderLocation:0}]}]},fragment:{module:s,entryPoint:T,targets:[{format:n,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"}}}]}})};this.columnFocusSelectPipeline=m("columnFocusSelect",t,"vertexColumnFocusSelect","fragmentColumnFocusSelect"),this.rowFocusSelectPipeline=m("rowFocusSelect",t,"vertexRowFocusSelect","fragmentRowFocusSelect"),this.bodyPipeline=m("body",t,"vertexBody","fragmentBody"),this.leftHeaderPipeline=m("leftHeader",t,"vertexLeftHeader","fragmentLeftHeader"),this.topHeaderPipeline=m("topHeader",t,"vertexTopHeader","fragmentTopHeader"),this.scrollBarBackgroundPipeline=m("scrollBarBackground",t,"vertexScrollBarBackground","fragmentScrollBarBackground"),this.scrollBarBodyPipeline=m("scrollBarBody",t,"vertexScrollBarBody","fragmentScrollBarBody",{constants:{scrollBarRadius:((o=i.scrollBar)==null?void 0:o.radius)||ht,scrollBarMargin:((S=i.scrollBar)==null?void 0:S.margin)||vt}}),this.vertexBuffer=qr("Vertices",t,Jr),ue(this.device,this.vertexBuffer,new Float32Array(Tn)),this.drawIndirectBufferSource=new Uint32Array(Gt),this.drawIndirectBuffer=t.createBuffer({label:"DrawIndirect",size:Gt.length*wt,usage:GPUBufferUsage.INDIRECT|GPUBufferUsage.COPY_DST}),this.updateDrawIndirectBuffer({numColumnsToShow:1,numRowsToShow:1}),this.f32UniformBuffer=kt("F32Uniforms",t,Yr),this.u32UniformBuffer=kt("U32Uniforms",t,Wr);const g=Math.max(u.gridSize.numColumns,u.gridSize.numRows)*It;this.focusedIndicesStorage=ot("FocusedIndexBuffer",t,g),this.selectedIndicesStorage=ot("SelectedIndexBuffer",t,g),this.gridDataBufferStorage=ot("GridDataBuffer",t,u.gridSize.numColumns*u.gridSize.numRows*4),this.bindGroup=this.createBindGroup("Grid BindGroup",c,this.f32UniformBuffer,this.u32UniformBuffer,this.focusedIndicesStorage,this.selectedIndicesStorage,this.gridDataBufferStorage),this.columnFocusRenderBundle=this.createColumnFocusRenderBundle(),this.rowFocusRenderBundle=this.createRowFocusRenderBundle(),this.bodyRenderBundle=this.createBodyRenderBundle(),this.topHeaderRenderBundle=this.createTopHeaderRenderBundle(),this.leftHeaderRenderBundle=this.createLeftHeaderRenderBundle(),this.scrollBarBodyRenderBundle=this.createScrollBarBodyRenderBundle(),this.scrollBarBackgroundRenderBundle=this.createScrollBarBackgroundRenderBundle()}updateF32UniformBuffer(t,n,r){ue(this.device,this.f32UniformBuffer,Hr(this.canvasElementContext,t,n,r))}updateU32UniformBuffer(t,n,r){ue(this.device,this.u32UniformBuffer,jr(t,n,r))}updateDataBufferStorage(t){ue(this.device,this.gridDataBufferStorage,t)}updateFocusedIndicesStorage(t){ue(this.device,this.focusedIndicesStorage,new Uint32Array(t))}updateSelectedIndicesStorage(t){ue(this.device,this.selectedIndicesStorage,new Uint32Array(t))}createBindGroup(t,n,r,i,u,s,c){return this.device.createBindGroup({label:t,layout:n,entries:[{binding:0,resource:{buffer:r}},{binding:1,resource:{buffer:i}},{binding:2,resource:{buffer:u}},{binding:3,resource:{buffer:s}},{binding:4,resource:{buffer:c}}]})}createRenderBundle(t,n,r){const i=this.device.createRenderBundleEncoder({label:t,colorFormats:[this.canvasFormat]});return i.setPipeline(n),i.setVertexBuffer(0,this.vertexBuffer),i.setBindGroup(0,this.bindGroup),i.drawIndirect(this.drawIndirectBuffer,r),i.finish()}updateDrawIndirectBuffer({numColumnsToShow:t,numRowsToShow:n}){ti(this.drawIndirectBufferSource,t,n),this.device.queue.writeBuffer(this.drawIndirectBuffer,0,this.drawIndirectBufferSource)}createBodyRenderBundle(){return this.createRenderBundle("body",this.bodyPipeline,ne.get("BODY"))}createColumnFocusRenderBundle(){return this.createRenderBundle("columnFocus",this.columnFocusSelectPipeline,ne.get("TOP_HEADER"))}createRowFocusRenderBundle(){return this.createRenderBundle("rowFocus",this.rowFocusSelectPipeline,ne.get("LEFT_HEADER"))}createTopHeaderRenderBundle(){return this.createRenderBundle("topHeader",this.topHeaderPipeline,ne.get("TOP_HEADER"))}createLeftHeaderRenderBundle(){return this.createRenderBundle("leftHeader",this.leftHeaderPipeline,ne.get("LEFT_HEADER"))}createScrollBarBackgroundRenderBundle(){return this.createRenderBundle("scrollBarBackground",this.scrollBarBackgroundPipeline,ne.get("SCROLLBAR_BACKGROUND"))}createScrollBarBodyRenderBundle(){return this.createRenderBundle("scrollBarBody",this.scrollBarBodyPipeline,ne.get("SCROLLBAR_BODY"))}executeRenderBundles(t){const n=this.device.createCommandEncoder(),r=this.canvasElementContext.multisample,i=r!==void 0?this.device.createTexture({size:[this.canvasElementContext.canvasSize.width,this.canvasElementContext.canvasSize.height],sampleCount:r,format:this.canvasFormat,usage:GPUTextureUsage.RENDER_ATTACHMENT}):this.canvasContext.getCurrentTexture(),u=r!==void 0?{resolveTarget:i.createView()}:{},s=n.beginRenderPass({colorAttachments:[{view:i.createView(),...u,clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:r!==void 0?"discard":"store"}]});s.executeBundles(t),s.end(),this.device.queue.submit([n.finish()])}execute(){this.executeRenderBundles([this.columnFocusRenderBundle,this.rowFocusRenderBundle,this.bodyRenderBundle,this.topHeaderRenderBundle,this.leftHeaderRenderBundle,this.scrollBarBackgroundRenderBundle,this.scrollBarBodyRenderBundle])}}const Cn=q.createContext({device:null,canvasContext:null,format:null,texture:null,gridContext:null,canvasElementContext:null,renderBundleBuilder:null}),ii=({children:e})=>{const t=wn(),n=En(),[r,i]=zn({device:null,canvasContext:null,format:null,texture:null,gridContext:null,canvasElementContext:null,renderBundleBuilder:null});if(Zt(()=>{if(!r.device)return(async()=>await async function(s){if(!t.canvasRef.current)return;const c=async()=>{try{const h=await navigator.gpu.requestAdapter();if(!h)throw new Error("No appropriate GPUAdapter found.");const m=await h.requestDevice();return m.lost.then(async g=>{if(console.error(`WebGPU device was lost: ${g.message}: ${g.reason}`),g.reason!=="destroyed")return console.error("Trying to recreate the device..."),s(await c(),n)}),m}catch{return console.error("Trying to recreate the device..."),await c()}};s(await c(),n)}((s,c)=>{const h=navigator.gpu.getPreferredCanvasFormat(),m=t.canvasRef.current;if(!m)throw new Error("Canvas element not found.");const g=m.getContext("webgpu");if(!g||!navigator.gpu)throw new Error("WebGPU not supported on this browser.");g.configure({device:s,format:h,alphaMode:"premultiplied"});const o=g.getCurrentTexture(),S=new ri(s,h,g,t,c);i({canvasContext:g,device:s,texture:o,format:h,gridContext:n,canvasElementContext:t,renderBundleBuilder:S})}))(),()=>{var u,s,c;(u=r.texture)==null||u.destroy(),(s=r.canvasContext)==null||s.unconfigure(),(c=r.device)==null||c.destroy()}},[t.canvasRef.current]),!(!r.device||!r.canvasContext||!r.renderBundleBuilder))return V(Cn.Provider,{value:r,children:e})},oi=()=>{const e=q.useContext(Cn);if(!e)throw new Error("useWebGPUContext must be used within a WebGPUContextProvider");if(!(!e.device||!e.canvasContext||!e.renderBundleBuilder))return e},On=q.createContext(null),ci=e=>{const t=e;return V(On.Provider,{value:t,children:e.children})},ui=()=>{const e=q.useContext(On);if(!e)throw new Error("useViewportContext must be used within a ViewportContextProvider");return e},Yt=.8,Ht=.975,j=-1,ee=-2,se=-3,ae=-4,le=-5,Xt=1,Wt=2,re=0,_e=1,at=0,fe=1,de=2,si=pt((e,t)=>{const{focusedStates:n,selectedStates:r}=e,i=oi(),u=ui(),s=En(),c=wn(),h=H(),m=H(-1),g=H(-1),o=H(u.initialViewport||{top:0,bottom:s.gridSize.numRows,left:0,right:s.gridSize.numColumns});Jt(t,()=>({updateData:(a,f)=>{ce(a,f)},updateFocusedIndices:(a,f,l)=>{k(a,f,l)},updateSelectedIndices:(a,f,l)=>{N(a,f,l)}}));const S=H(u.initialOverscroll||{x:0,y:0}),P=H({numColumnsToShow:0,numRowsToShow:0}),d=H(null),v=H({x:0,y:0}),T=H(!1),p=H(at),B=(a,f,l)=>{const y=l.left<0,b=l.right>s.gridSize.numColumns,x=l.top<0,C=l.bottom>s.gridSize.numRows,_=p.current===at;y?(v.current.y=0,b?(o.current.left=0,o.current.right=s.gridSize.numColumns,_&&(S.current.x=0)):(o.current.left=0,o.current.right=a.width,_&&(S.current.x=l.left*f.width))):b?(v.current.y=0,o.current.left=s.gridSize.numColumns-a.width,o.current.right=s.gridSize.numColumns,_&&(S.current.x=(l.right-s.gridSize.numColumns)*f.width)):!C&&!x&&(o.current.left=l.left,o.current.right=l.right,_&&(S.current.x=0)),x?(v.current.y=0,C?(o.current.top=0,o.current.bottom=s.gridSize.numRows,_&&(S.current.y=0)):(o.current.top=0,o.current.bottom=a.height,_&&(S.current.y=l.top*f.height))):C?(v.current.y=0,o.current.top=s.gridSize.numRows-a.height,o.current.bottom=s.gridSize.numRows,_&&(S.current.y=(l.bottom-s.gridSize.numRows)*f.height)):!b&&!y&&(o.current.top=l.top,o.current.bottom=l.bottom,_&&(S.current.y=0))},$=()=>{if(d.current){const a=d.current.startViewport.right-d.current.startViewport.left,f=d.current.startViewport.bottom-d.current.startViewport.top,[l,y]=p.current===fe?[-1*(s.gridSize.numColumns*d.current.delta.x)/(c.canvasSize.width-c.headerOffset.left),0]:p.current===de?[0,-1*(s.gridSize.numRows*d.current.delta.y)/(c.canvasSize.height-c.headerOffset.top)]:[a*d.current.delta.x/(c.canvasSize.width-c.headerOffset.left),f*d.current.delta.y/(c.canvasSize.height-c.headerOffset.top)],b={left:d.current.startViewport.left-l,right:d.current.startViewport.right-l,top:d.current.startViewport.top-y,bottom:d.current.startViewport.bottom-y};B(d.current.startViewportSize,d.current.startCellSize,b)}else{const a={width:o.current.right-o.current.left,height:o.current.bottom-o.current.top};B(a,{width:(c.canvasSize.width-c.headerOffset.left)/a.width,height:(c.canvasSize.height-c.headerOffset.top)/a.height},p.current===fe||p.current===de?o.current:{left:o.current.left+v.current.x,right:o.current.right+v.current.x,top:o.current.top+v.current.y,bottom:o.current.bottom+v.current.y})}},ce=(a,f)=>{var l,y;s.data=f,(l=i==null?void 0:i.renderBundleBuilder)==null||l.updateDataBufferStorage(f),a===e.canvasId&&((y=e.onDataChanged)==null||y.call(e,e.canvasId,f))},k=(a,f,l)=>{var y,b;f===m.current&&l===g.current||(n.fill(0),f!==-1&&l===-1?n[f]=Xt:f===-1&&l!==-1?n[l]=Wt:f!==-1&&l!==-1&&(n[f]=Xt,n[l]=Wt),m.current=f,g.current=l,(y=i==null?void 0:i.renderBundleBuilder)==null||y.updateFocusedIndicesStorage(n),tt(),a===e.canvasId&&((b=e.onFocusedStatesChange)==null||b.call(e,e.canvasId,f,l)))},N=(a,f,l)=>{var y,b;if(a===e.canvasId){if(f===j)if(l===j){const x=r.some(C=>C>0);r.fill(x?0:1)}else for(let x=0;x<r.length;x++)if(x<r.length){const C=r[x];r[x]=l===x?C===re?_e:re:C}else r[x]=re;else if(l===j)for(let x=0;x<r.length;x++)if(x<r.length){const C=r[x];r[x]=f===x?C===_e?re:_e:C}else r[x]=re;else for(let x=0;x<r.length;x++)if(x<r.length){const C=r[x];r[x]=l===x||f===x?C===re?_e:re:C}}(y=i==null?void 0:i.renderBundleBuilder)==null||y.updateSelectedIndicesStorage(r),a===e.canvasId&&((b=e.onSelectedStatesChange)==null||b.call(e,e.canvasId,f,l))},E=()=>{const a=()=>{const l=Math.min(Math.ceil(o.current.right)-Math.floor(o.current.left),s.gridSize.numColumns),y=Math.min(Math.ceil(o.current.bottom)-Math.floor(o.current.top),s.gridSize.numRows);P.current={numColumnsToShow:l,numRowsToShow:y}},f=()=>{i!=null&&i.renderBundleBuilder&&(i.renderBundleBuilder.updateF32UniformBuffer(s,o.current,S.current),i.renderBundleBuilder.updateU32UniformBuffer(s,P.current,p.current),i.renderBundleBuilder.updateDrawIndirectBuffer(P.current),i.renderBundleBuilder.execute())};$(),a(),f()},Et=(a,f)=>{var Y,be;const l=c.canvasRef.current.getBoundingClientRect(),y=a-l.left,b=f-l.top,x=(c.canvasSize.width-c.headerOffset.left)/(o.current.right-o.current.left),C=(c.canvasSize.height-c.headerOffset.top)/(o.current.bottom-o.current.top),_=(y-S.current.x-c.headerOffset.left)/x,A=(b-S.current.y-c.headerOffset.top)/C,X=_>=0&&_+o.current.left<s.gridSize.numColumns,G=A>=0&&A+o.current.top<s.gridSize.numRows;if(X)if(G){const Te=c.scrollBar?c.scrollBar.margin:vt,te=c.scrollBar?c.scrollBar.radius:ht;if(c.canvasSize.width-Te-te*2<=y&&y<=c.canvasSize.width-Te){const W=S.current.y+c.headerOffset.top,nt=W-te+(c.canvasSize.height-W-te*2)*o.current.top/s.gridSize.numRows,rt=W+te*2+(c.canvasSize.height-W-te*2)*o.current.bottom/s.gridSize.numRows;return W<=b&&b<nt?{columnIndex:le,rowIndex:se}:b<rt?{columnIndex:le,rowIndex:ee}:{columnIndex:le,rowIndex:ae}}const Ce=((Y=c.scrollBar)==null?void 0:Y.margin)||vt,ge=((be=c.scrollBar)==null?void 0:be.radius)||ht;if(c.canvasSize.height-Ce-ge*2<=b&&b<=c.canvasSize.height-Ce){const W=S.current.x+c.headerOffset.left,nt=W-ge+(c.canvasSize.width-W-ge*2)*o.current.left/s.gridSize.numColumns,rt=W+ge*2+(c.canvasSize.width-W-ge*2)*o.current.right/s.gridSize.numColumns;return W<=y&&y<=nt?{columnIndex:se,rowIndex:le}:y<=rt?{columnIndex:ee,rowIndex:le}:{columnIndex:ae,rowIndex:le}}return{columnIndex:Math.floor(_+o.current.left),rowIndex:Math.floor(A+o.current.top)}}else return{columnIndex:Math.floor(_+o.current.left),rowIndex:j};else return G?{columnIndex:j,rowIndex:Math.floor(A+o.current.top)}:{columnIndex:j,rowIndex:j}},Bt=(a,f)=>{if(c.canvasRef.current===null)return;const l=Et(a,f);if((l.columnIndex===j||l.rowIndex===j)&&(c.canvasRef.current.style.cursor="grab",N(e.canvasId,l.columnIndex,l.rowIndex)),l.columnIndex>=0&&l.rowIndex>=0||l.columnIndex===j||l.rowIndex===j||l.columnIndex===ee||l.rowIndex===ee){c.canvasRef.current.style.cursor="grab",d.current={start:{x:a,y:f},previous:{x:a,y:f},startViewportSize:{width:o.current.right-o.current.left,height:o.current.bottom-o.current.top},startCellSize:{width:(c.canvasSize.width-c.headerOffset.left)/(o.current.right-o.current.left),height:(c.canvasSize.height-c.headerOffset.top)/(o.current.bottom-o.current.top)},startViewport:{...o.current},delta:{x:0,y:0}};return}else l.columnIndex===se?o.current.left*2-o.current.right<0?o.current={...o.current,left:0,right:o.current.right-o.current.left}:o.current={...o.current,left:o.current.left*2-o.current.right,right:o.current.left}:l.rowIndex===se?o.current.top*2-o.current.bottom<0?o.current={...o.current,top:0,bottom:o.current.bottom-o.current.top}:o.current={...o.current,top:o.current.top*2-o.current.bottom,bottom:o.current.top}:l.columnIndex===ae?o.current.right*2-o.current.left<s.gridSize.numColumns?o.current={...o.current,left:o.current.right,right:o.current.right*2-o.current.left}:o.current={...o.current,left:s.gridSize.numColumns-(o.current.right-o.current.left),right:s.gridSize.numColumns}:l.rowIndex===ae&&(o.current.bottom*2-o.current.top<s.gridSize.numRows?o.current={...o.current,top:o.current.bottom,bottom:o.current.bottom*2-o.current.top}:o.current={...o.current,top:s.gridSize.numRows-(o.current.bottom-o.current.top),bottom:s.gridSize.numRows})},Je=a=>{Bt(a.clientX,a.clientY)},bt=a=>{Bt(a.touches[0].clientX,a.touches[0].clientY)},Tt=()=>{c.canvasRef.current.style.cursor="default",d.current=null,k(e.canvasId,-1,-1)},Ct=()=>{Tt()},Ot=a=>{Tt()},_t=()=>{c.canvasRef.current.style.cursor="default",k(e.canvasId,-1,-1)},Ft=()=>{tt()},zt=(a,f,l,y)=>{if(!c.canvasRef.current||!d.current)throw new Error;const b=a-d.current.start.x,x=f-d.current.start.y;d.current.delta={x:b,y:x},v.current={x:-l*d.current.startViewportSize.width/c.canvasSize.width,y:-y*d.current.startViewportSize.height/c.canvasSize.height}},Lt=(a,f)=>{var y;const l=Et(a,f);l.columnIndex===ee&&l.rowIndex===ee?(c.canvasRef.current.style.cursor="pointer",p.current=fe|de):l.columnIndex===ee?(c.canvasRef.current.style.cursor="pointer",p.current=fe):l.rowIndex===ee?(c.canvasRef.current.style.cursor="pointer",p.current=de):l.columnIndex===se?(c.canvasRef.current.style.cursor="w-resize",p.current=fe):l.columnIndex===ae?(c.canvasRef.current.style.cursor="e-resize",p.current=fe):l.rowIndex===se?(c.canvasRef.current.style.cursor="n-resize",p.current=de):l.rowIndex===ae?(c.canvasRef.current.style.cursor="s-resize",p.current=de):(c.canvasRef.current.style.cursor="cell",p.current=at),(y=i==null?void 0:i.renderBundleBuilder)==null||y.updateU32UniformBuffer(s,P.current,p.current),k(e.canvasId,l.columnIndex,l.rowIndex)},Qe=a=>{if(!c.canvasRef.current)throw new Error;d.current?(c.canvasRef.current.style.cursor="grabbing",zt(a.clientX,a.clientY,a.movementX,a.movementY)):(c.canvasRef.current.style.cursor="default",Lt(a.clientX,a.clientY))},Pt=a=>{if(!c.canvasRef.current)throw new Error;a.touches.length>=2&&d.current?(c.canvasRef.current.style.cursor="grabbing",zt(a.touches[0].clientX,a.touches[0].clientY,a.touches[0].clientX-d.current.previous.x,a.touches[0].clientY-d.current.previous.y),d.current.previous={x:a.touches[0].clientX,y:a.touches[0].clientY}):(c.canvasRef.current.style.cursor="default",Lt(a.touches[0].clientX,a.touches[0].clientY))},et=a=>{if(a.deltaY===0||!c.canvasRef.current)return;const f=a.deltaY>0?1.03:.98,l=c.canvasRef.current.getBoundingClientRect(),y=a.clientX-l.left-c.headerOffset.left,b=a.clientY-l.top-c.headerOffset.top,x={width:o.current.right-o.current.left,height:o.current.bottom-o.current.top},C=x.width*y/(c.canvasSize.width-c.headerOffset.left)+o.current.left,_=x.height*b/(c.canvasSize.height-c.headerOffset.top)+o.current.top;let A=C+(o.current.left-C)*f,X=C+(o.current.right-C)*f,G=_+(o.current.top-_)*f,Y=_+(o.current.bottom-_)*f;const be=-1*A,Te=-1*G,te=X-s.gridSize.numColumns,Ce=Y-s.gridSize.numRows;A<0&&s.gridSize.numColumns<X?(A=0,X=o.current.right):A<0?(A=0,X+=be):s.gridSize.numColumns<X&&(X=s.gridSize.numColumns,A-=te),G<0&&s.gridSize.numRows<Y?(G=0,Y=o.current.bottom):G<0?(G=0,Y+=Te):s.gridSize.numRows<Y&&(Y=s.gridSize.numRows,G-=Ce),B({width:X-A,height:Y-G},{width:(c.canvasSize.width-c.headerOffset.left)/X-A,height:(c.canvasSize.height-c.headerOffset.top)/Y-G},{left:A,right:X,top:G,bottom:Y}),tt()},tt=()=>{h.current||(h.current=setInterval(()=>{if(!d.current){const a=()=>Math.abs(S.current.x)>.1||Math.abs(S.current.y)>.1?(S.current={x:S.current.x*Yt,y:S.current.y*Yt},!0):(S.current={x:0,y:0},!1),f=()=>Math.abs(v.current.x)>.01||Math.abs(v.current.y)>.01?(v.current.x*=Ht,v.current.y*=Ht,!0):(v.current.x=0,v.current.y=0,!1),l=a(),y=f();!l&&!y&&(clearInterval(h.current),h.current=void 0)}requestAnimationFrame(E)},16))};return Ln(()=>{const a=c.canvasRef.current;if(a&&!T.current){if(a.addEventListener("mousedown",Je,{passive:!0}),a.addEventListener("mousemove",Qe,{passive:!0}),a.addEventListener("mouseup",Ct,{passive:!0}),a.addEventListener("touchstart",bt,{passive:!0}),a.addEventListener("touchmove",Pt,{passive:!0}),a.addEventListener("touchend",Ot,{passive:!0}),a.addEventListener("mouseenter",Ft,{passive:!0}),a.addEventListener("mouseout",_t,{passive:!0}),a.addEventListener("wheel",et,{passive:!0}),T.current=!0,i!=null&&i.renderBundleBuilder)i.renderBundleBuilder.updateDataBufferStorage(s.data),i.renderBundleBuilder.updateSelectedIndicesStorage(r),i.renderBundleBuilder.updateFocusedIndicesStorage(n);else throw new Error;E()}return()=>{a&&(a.removeEventListener("mousedown",Je),a.removeEventListener("mousemove",Qe),a.removeEventListener("mouseup",Ct),a.removeEventListener("touchstart",bt),a.removeEventListener("touchmove",Pt),a.removeEventListener("touchend",Ot),a.removeEventListener("mouseenter",Ft),a.removeEventListener("mouseout",_t),a.removeEventListener("wheel",et),T.current=!1)}},[c.canvasRef,T.current,Je,Qe,et]),null}),jt=pt((e,t)=>{const n=q.useRef(null);return Jt(t,()=>({updateData:(r,i)=>{var u;(u=n.current)==null||u.updateData(r,i)},updateFocusedIndices:(r,i,u)=>{var s;(s=n.current)==null||s.updateFocusedIndices(r,i,u)},updateSelectedIndices:(r,i,u)=>{var s;(s=n.current)==null||s.updateSelectedIndices(r,i,u)}})),V($r,{canvasId:e.canvasId,headerOffset:e.headerOffset,canvasSize:e.canvasSize,scrollBar:e.scrollBar,children:V(kr,{gridSize:e.gridSize,data:e.data,children:V(ii,{children:V(ci,{initialViewport:e.initialViewport,initialOverscroll:e.initialOverscroll,children:V(si,{ref:n,canvasId:e.canvasId,focusedStates:e.focusedStates,selectedStates:e.selectedStates,onFocusedStatesChange:e.onFocusedStatesChange,onSelectedStatesChange:e.onSelectedStatesChange})})})})})}),me={numColumns:1024,numRows:1024},_n=Math.max(me.numColumns,me.numRows),he=new Float32Array(me.numRows*me.numColumns);for(let e=0;e<he.length;e++)Math.random()<.99?he[e]=e/he.length:he[e]=1/0;const qt=new Uint8Array(_n),Kt=new Uint8Array(_n),ai="example1",li="example2",fi=()=>{const e=H(null),t=H(null);return Sn(gn,{children:[V(jt,{ref:e,canvasId:ai,headerOffset:{left:28,top:28},canvasSize:{width:512,height:512},scrollBar:{radius:5,margin:2},gridSize:me,data:he,focusedStates:qt,selectedStates:Kt,onFocusedStatesChange:(n,r,i)=>{var u;(u=t.current)==null||u.updateFocusedIndices(n,r,i)},onSelectedStatesChange:(n,r,i)=>{var u;(u=t.current)==null||u.updateSelectedIndices(n,r,i)},initialViewport:{top:0,bottom:16,left:0,right:16}}),V(jt,{canvasId:li,ref:t,headerOffset:{left:28,top:28},canvasSize:{width:512,height:512},scrollBar:{radius:5,margin:2},gridSize:me,data:he,focusedStates:qt,selectedStates:Kt,onFocusedStatesChange:(n,r,i)=>{var u;(u=e.current)==null||u.updateFocusedIndices(n,r,i)},onSelectedStatesChange:(n,r,i)=>{var u;(u=e.current)==null||u.updateSelectedIndices(n,r,i)},initialViewport:{top:0,bottom:24,left:0,right:24}})]})},di=yn(document.getElementById("root")),hi=()=>{di.render(V(gn,{children:V(fi,{})}))};hi();
