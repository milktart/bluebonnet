import { Y as head, a7 as attr, a2 as escape_html } from "../../../chunks/index2.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let firstName = "";
    let lastName = "";
    let email = "";
    let password = "";
    let confirmPassword = "";
    let loading = false;
    head("52fghe", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Register</title>`);
      });
    });
    $$renderer2.push(`<main class="flex flex-col justify-center flex-1 py-6 sm:px-6 lg:px-8 bg-gray-50 min-h-screen"><div class="sm:mx-auto sm:w-full sm:max-w-md"><div class="flex justify-center"><div class="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg></div></div> <h2 class="mt-4 text-center text-3xl font-bold tracking-tight text-gray-900">Create your account</h2> <p class="mt-2 text-center text-sm text-gray-600">Join Travel Planner and start organizing your adventures</p></div> <div class="mt-6 sm:mx-auto sm:w-full sm:max-w-md">`);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="bg-white py-6 px-4 shadow-xl ring-1 ring-gray-900/5 sm:rounded-xl sm:px-10"><form class="space-y-4"><div class="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label for="firstName" class="block text-sm font-medium leading-6 text-gray-900">First name</label> <div class="mt-2"><input id="firstName" name="firstName" type="text" autocomplete="given-name" required${attr("value", firstName)} class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3" placeholder="John"/></div></div> <div><label for="lastName" class="block text-sm font-medium leading-6 text-gray-900">Last initial</label> <div class="mt-2"><input id="lastName" name="lastName" type="text" autocomplete="family-name" required maxlength="1"${attr("value", lastName)} class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3" placeholder="D"/></div></div></div> <div><label for="email" class="block text-sm font-medium leading-6 text-gray-900">Email address</label> <div class="mt-2"><input id="email" name="email" type="email" autocomplete="email" required${attr("value", email)} class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3" placeholder="john@example.com"/></div></div> <div><label for="password" class="block text-sm font-medium leading-6 text-gray-900">Password</label> <div class="mt-2"><input id="password" name="password" type="password" autocomplete="new-password" required minlength="6"${attr("value", password)} class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3" placeholder="Enter your password"/></div> <p class="mt-2 text-sm text-gray-500">Must be at least 6 characters long.</p></div> <div><label for="confirmPassword" class="block text-sm font-medium leading-6 text-gray-900">Confirm password</label> <div class="mt-2"><input id="confirmPassword" name="confirmPassword" type="password" autocomplete="new-password" required${attr("value", confirmPassword)} class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3" placeholder="Confirm your password"/></div></div> <div><button type="submit"${attr("disabled", loading, true)} class="flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">${escape_html("Create account")}</button></div></form> <div class="mt-6"><div class="relative"><div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-300"></div></div> <div class="relative flex justify-center text-sm"><span class="bg-white px-2 text-gray-500">Already have an account?</span></div></div> <div class="mt-6"><a href="/login" class="flex w-full justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors duration-200">Sign in to your account</a></div></div></div></div></main>`);
  });
}
export {
  _page as default
};
