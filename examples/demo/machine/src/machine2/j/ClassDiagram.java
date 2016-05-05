package machine2.j;

import hu.elte.txtuml.api.layout.ClassDiagram;
import hu.elte.txtuml.api.layout.Right;
import machine2.j.model.Machine;
import machine2.j.model.User;

class Machine2Diagram extends ClassDiagram {
	@Right(from = Machine.class, val = User.class)
	class MachineLayout extends Layout {
	}
}
