import { appUrl } from "@/lib/email";

/** The one-line install: <script async src="https://app/api/px/script?o=ORG_ID"></script> */
export async function GET(req: Request) {
  const orgId = new URL(req.url).searchParams.get("o") ?? "";
  const js = `(function(){try{
var b="${appUrl()}/api/px/collect?o=${orgId.replace(/[^0-9a-f-]/gi, "")}";
function hit(){(new Image(1,1)).src=b+"&p="+encodeURIComponent(location.pathname)+"&t="+Date.now();}
hit();
var p=history.pushState;history.pushState=function(){p.apply(this,arguments);hit();};
}catch(e){}})();`;
  return new Response(js, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
