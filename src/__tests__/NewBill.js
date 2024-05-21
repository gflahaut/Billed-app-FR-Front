/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom";
import '@testing-library/jest-dom/extend-expect';
import NewBillUI from "../views/NewBillUI.js";
import { ROUTES} from "../constants/routes.js";
import mockStore from "../__mocks__/store";
import { localStorageMock } from "../__mocks__/localStorage.js";

jest.mock("../app/format.js", () => ({
  formatDate: jest.fn(),
  formatStatus: jest.fn(),
}));

jest.mock("../app/store", () => mockStore);

import NewBill from "../containers/NewBill.js";


describe("Given I am connected as an employee and I am on the NewBill page", () => {
  test("Then I see the title 'Envoyer une note de frais'", () => {
    const html = NewBillUI();
    document.body.innerHTML = html;

    expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
  });

  describe("When I upload a file", () => {
    test("if the extension is valid, should add the image to the input", () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
    
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "employee@test.tld",
        })
      );
    
      document.body.innerHTML = NewBillUI();
    
      const fileInput = screen.getByTestId("file");
      const testFile = new File(["image"], "image.png", { type: "image/png" });
      fireEvent.change(fileInput, {
        target: { files: [testFile] },
      });
    
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
    
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
    
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      fileInput.addEventListener("change", handleChangeFile);
      fireEvent.change(fileInput);
    
      expect(fileInput.files[0]).toBeTruthy();
      expect(fileInput.files[0].name).toBe("image.png");
      expect(fileInput.files[0].name).toMatch(/\.(jpeg|jpg|png)$/i);
      expect(handleChangeFile).toHaveBeenCalled();
    });

    test("if the extension is invalid, it should display an alert pop-up", () => {
      window.alert = jest.fn();
      document.body.innerHTML = NewBillUI();
    
      const fileInput = screen.getByTestId("file");
      const invalidFile = new File(["image"], "image.pdf", { type: "application/pdf" });
    
      fireEvent.change(fileInput, {
        target: { files: [invalidFile] },
      });
    
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
    
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
    
      const handleChangeFile = jest.fn(newBill.handleChangeFile.bind(newBill));
      fileInput.addEventListener("change", handleChangeFile);
      fireEvent.change(fileInput);
    
      expect(window.alert).toHaveBeenCalled();
      expect(fileInput.files[0].name).not.toMatch(/\.(jpeg|jpg|png)$/i);
      expect(fileInput.value).toBe('');
    });
  });

  describe("When I add a new bill", () => {
    test("should add a new bill", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "employee@test.tld",
        })
      );
  
      document.body.innerHTML = NewBillUI();
  
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
  
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
  
      const formNewBill = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(newBill.handleSubmit.bind(newBill));
  
      formNewBill.addEventListener("submit", handleSubmit);
      fireEvent.submit(formNewBill);
  
      expect(handleSubmit).toHaveBeenCalled();
      expect(formNewBill).toBeTruthy();
    });
  });

  describe("Given I am connected as an employee", () => {
    describe("When I am on NewBill Page and I upload a file", () => {
      let newBill;
  
      beforeEach(() => {
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({ type: "Employee", email: "employee@test.tld" })
        );
        document.body.innerHTML = NewBillUI();
        newBill = new NewBill({
          document,
          onNavigate: jest.fn(),
          store: mockStore,
          localStorage: window.localStorage,
        });
      });
  
      test("Then it should show an alert and reset the input if the file is invalid", () => {
        const fileInput = screen.getByTestId("file");
  
        const handleChangeFile = jest.fn(newBill.handleChangeFile);
  
        fileInput.addEventListener("change", handleChangeFile);
  
        window.alert = jest.fn();
  
        const invalidFile = new File(["dummy content"], "example.txt", {
          type: "text/plain",
        });
  
        fireEvent.change(fileInput, {
          target: { files: [invalidFile] },
        });
  
        expect(handleChangeFile).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalledWith("Veuillez sélectionner un fichier valide avec une extension.");
        expect(fileInput.value).toBe("");
      });
  
      test("Then it should show an alert and reset the input if the file has an invalid extension", () => {
        const fileInput = screen.getByTestId("file");
  
        const handleChangeFile = jest.fn(newBill.handleChangeFile);
  
        fileInput.addEventListener("change", handleChangeFile);
  
        window.alert = jest.fn();
  
        const invalidExtensionFile = new File(["dummy content"], "example.pdf", {
          type: "application/pdf",
        });
  
        fireEvent.change(fileInput, {
          target: { files: [invalidExtensionFile] },
        });
  
        expect(handleChangeFile).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalledWith("Veuillez sélectionner un fichier valide avec une extension.");
        expect(fileInput.value).toBe("");
      });
  
      test("Then it should call the store and set the file URL and name if the file is valid", async () => {
        const fileInput = screen.getByTestId("file");
  
        const handleChangeFile = jest.fn(newBill.handleChangeFile);
  
        fileInput.addEventListener("change", handleChangeFile);
  
        const validFile = new File(["dummy content"], "976fbc50929ab2852a517ff682c603f5.png", {
          type: "image/png",
        });
  
        mockStore.bills().create = jest.fn().mockResolvedValue({
          fileUrl: "../assets/images/976fbc50929ab2852a517ff682c603f5.png",
          key: "12345",
          fileName : "976fbc50929ab2852a517ff682c603f5.png"
        });
  
        fireEvent.change(fileInput, {
          target: { files: [validFile] },
        });
  
        expect(handleChangeFile).toHaveBeenCalled();
        expect(mockStore.bills().create).toHaveBeenCalled();
  
        await new Promise(process.nextTick);
  
        expect(newBill.fileUrl).toBe("../assets/images/976fbc50929ab2852a517ff682c603f5.png");
        expect(newBill.billId).toBe("12345");
        expect(newBill.fileName).toBe("976fbc50929ab2852a517ff682c603f5.png");
      });
    });
  });

});