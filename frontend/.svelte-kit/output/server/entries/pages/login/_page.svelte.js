import { _ as head, a2 as attr, a7 as escape_html } from "../../../chunks/index.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let email = "";
    let password = "";
    let loading = false;
    head("1x05zx6", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Login</title>`);
      });
    });
    $$renderer2.push(`<nav class="bg-white border-b border-gray-200"><div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div class="flex h-16 items-center justify-between"><div class="flex items-center space-x-2"><div class="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center"><svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg></div> <span class="text-lg font-semibold text-gray-900">Travel Planner</span></div> <a href="/" class="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-sm font-semibold text-white hover:bg-blue-500 transition-colors duration-200">Back Home</a></div></div></nav> <main class="flex flex-col justify-center flex-1 py-6 sm:px-6 lg:px-8" style="margin-top: -10%;"><div class="sm:mx-auto sm:w-full sm:max-w-md"><div class="flex justify-center"><div class="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg></div></div> <h2 class="mt-4 text-center text-3xl font-bold tracking-tight text-gray-900">Welcome to Travel Planner</h2> <p class="mt-2 text-center text-sm text-gray-600">Sign in to your account to continue</p></div> <div class="mt-6 sm:mx-auto sm:w-full sm:max-w-md">`);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="bg-white py-6 px-4 shadow-xl ring-1 ring-gray-900/5 sm:rounded-xl sm:px-10"><form class="space-y-6"><div><label for="email" class="block text-sm font-medium leading-6 text-gray-900">Email address</label> <div class="mt-2"><input id="email" name="email" type="email" autocomplete="email" required${attr("value", email)} class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3" placeholder="Enter your email"/></div></div> <div><label for="password" class="block text-sm font-medium leading-6 text-gray-900">Password</label> <div class="mt-2"><input id="password" name="password" type="password" autocomplete="current-password" required${attr("value", password)} class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3" placeholder="Enter your password"/></div></div> <div><button type="submit"${attr("disabled", loading, true)} class="flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">${escape_html("Sign in")}</button></div></form></div></div></main> <footer class="bg-white border-t border-gray-200 mt-auto"><div class="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8"><div class="flex justify-center space-x-2 md:order-2"><div class="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center"><svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg></div> <span class="text-sm leading-6 text-gray-500">© 2025 Travel Planner. Plan your perfect journey.</span></div></div></footer>`);
  });
}
export {
  _page as default
};
