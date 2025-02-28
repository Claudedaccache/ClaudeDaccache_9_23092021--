import { ROUTES_PATH } from "../constants/routes.js";
import { formatDate, formatStatus } from "../app/format.js";
import Logout from "./Logout.js";

export function sortedBills (bills, userEmail){
  let allFilteredBills = bills.filter(
    (bill) => bill.email === userEmail
  );

  let filtredBills = allFilteredBills.filter(
    (bill) =>
      bill.date !== "" &&
      new Date(bill.date) < Date.now() &&
      new Date(bill.date) > new Date("2000")
  );

  const antiChrono = (a, b) => {
    return new Date(b.date) - new Date(a.date);
  };

  return filtredBills.sort(antiChrono);
}

export default class {
  constructor({ document, onNavigate, firestore, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.firestore = firestore;
    const buttonNewBill = document.querySelector(
      `button[data-testid="btn-new-bill"]`
    );
    if (buttonNewBill)
      buttonNewBill.addEventListener("click", this.handleClickNewBill);
    const iconEye = document.querySelectorAll(`div[data-testid="icon-eye"]`);
    if (iconEye)
      iconEye.forEach((icon) => {
        icon.addEventListener("click", (e) => this.handleClickIconEye(icon));
      });
    new Logout({ document, localStorage, onNavigate });
  }

  handleClickNewBill = (e) => {
    this.onNavigate(ROUTES_PATH["NewBill"]);
  };

  handleClickIconEye = (icon) => {
    const billUrl = icon.getAttribute("data-bill-url");
    console.log(billUrl);
    let urlArray = billUrl.split("?");
    urlArray.splice(urlArray.length - 1, 1);
    let cleanUrlArray = urlArray.join("").split(".");
    let ext = cleanUrlArray[cleanUrlArray.length - 1];
    console.log(ext);
    let isAuthorizedFile = $.inArray(ext, ["png", "jpg", "jpeg"]) > -1;
    if (
      billUrl === "null" ||
      billUrl === "" ||
      typeof billUrl == "undefined" ||
      !isAuthorizedFile
    ) {
      $("#modaleFile").find(".modal-body").html(
        "<h6 style='text-align: center;'>Veuillez saisir un document ayant l'une des extensions suivantes : jpg, jpeg ou png</h6>" ///used 100% instead of ${imgWidth}///
      );
      $("#modaleFile").modal("show");
    } else {
      // const imgWidth = Math.floor($("#modaleFile").width() * 0.5);          ///removed ///
      $("#modaleFile").find(".modal-body").html(
        `<div style='text-align: center;'><img width=100% src="${billUrl}" /></div>` ///used 100% instead of ${imgWidth}///
      );
      $("#modaleFile").modal("show");
    }
  };

  // not need to cover this function by tests
  getBills = () => {
    const userEmail = localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user")).email
      : "";
    if (this.firestore) {
      return this.firestore
        .bills()
        .get()
        .then((snapshot) => {
          const unsortedBills = snapshot.docs.map((doc) => doc.data());
          const bills = sortedBills (unsortedBills, userEmail).map((bill) => {
            try {
              return {
                ...bill,
                date: formatDate(bill.date),
                status: formatStatus(bill.status),
              };
            } catch (e) {
              return {
                ...bill,
                date: bill.date,
                status: formatStatus(bill.status),
              };
            }
          });
          return bills;
        })
        .catch((error) => error);
    }
  };
}
