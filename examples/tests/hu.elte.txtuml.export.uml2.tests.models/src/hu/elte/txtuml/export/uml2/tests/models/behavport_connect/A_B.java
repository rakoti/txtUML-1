package hu.elte.txtuml.export.uml2.tests.models.behavport_connect;

import hu.elte.txtuml.api.model.Composition;
import hu.elte.txtuml.api.model.Connector;

public class A_B extends Composition {
	class A_End extends Container<A> {
	}

	class B_End extends One<B> {
	}
}
class A_B_Connector extends Connector {
	class A_End extends One<A_B.A_End, A.A_Port> {
	}

	class B_End extends One<A_B.B_End, B.B_Port> {
	}
}