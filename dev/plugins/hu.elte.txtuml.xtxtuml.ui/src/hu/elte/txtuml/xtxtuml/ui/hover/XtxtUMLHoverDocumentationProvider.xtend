package hu.elte.txtuml.xtxtuml.ui.hover;

import org.eclipse.emf.ecore.EObject
import org.eclipse.xtext.xbase.ui.hover.XbaseHoverDocumentationProvider

class XtxtUMLHoverDocumentationProvider extends XbaseHoverDocumentationProvider {

	/**
	 * Doesn't delegate generated annotations of XtxtUML entities.
	 */
	override protected addAnnotations(EObject obj) {
		if (!obj.class.canonicalName.startsWith("hu.elte.txtuml.xtxtuml.xtxtUML")) {
			super.addAnnotations(obj);
		}
	}

}
